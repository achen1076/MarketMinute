import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAnalyzedNewsForSymbol, NewsItem } from "@/lib/news";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import {
  getExplanationFromCache,
  setExplanationInCache,
  cleanExpiredExplanations,
  isCacheStale,
  formatCacheAge,
  type ExplanationCacheEntry,
} from "@/lib/explainCache";
import { computeSmartAlerts, SmartAlert } from "@/lib/smartAlerts";
import { getCachedSnapshots } from "@/lib/tickerCache";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rateLimit";

type ExplainPayload = {
  symbol: string;
  changePct: number;
  price: number | null;
  watchlistName: string | null;
  news: Array<{
    title: string;
    summary: string;
    publishedAt: string;
    relevanceScore?: number;
    sentiment?: "positive" | "negative" | "neutral";
  }>;
  smartAlerts: SmartAlert[];
};

// Zod schema for structured output
const explanationSchema = z.object({
  summary: z
    .string()
    .describe(
      "A concise summary paragraph highlighting key metrics and the overall story. Include specific percentages, dollar amounts, and key facts in bold."
    ),
  keyPoints: z
    .array(
      z.object({
        title: z
          .string()
          .describe(
            "Bold title for the key point (e.g., 'Earnings Pressure', 'Theme Park Growth')"
          ),
        explanation: z
          .string()
          .describe(
            "Brief explanation of this key point with specific details"
          ),
      })
    )
    .describe("3-4 key points that explain the stock movement or situation"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rateLimitResult = checkRateLimit(
    "explain",
    session.user.email,
    RateLimitPresets.AI_EXPLAIN
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  const body = await req.json();
  const { symbol, changePct, price, watchlistName } = body as {
    symbol: string;
    changePct: number;
    price?: number;
    watchlistName?: string;
  };

  cleanExpiredExplanations();

  // Check cache first
  const cachedEntry = await getExplanationFromCache(symbol);

  if (cachedEntry) {
    const isStale = isCacheStale(cachedEntry);

    if (isStale) {
      // Cache is stale (>= 30 min old), trigger background refresh
      console.log(
        `[Explain] Cache stale for ${symbol}, triggering background refresh`
      );

      // Return cached explanation immediately
      const response = NextResponse.json(
        {
          explanation: cachedEntry.explanation,
          cached: true,
          age: formatCacheAge(cachedEntry),
          refreshing: true,
        },
        {
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );

      // Trigger background refresh (don't await)
      refreshExplanation(symbol, changePct, price).catch((error) => {
        console.error(
          `[Explain] Background refresh failed for ${symbol}:`,
          error
        );
      });

      return response;
    }

    // Cache is fresh, return it
    return NextResponse.json(
      {
        explanation: cachedEntry.explanation,
        cached: true,
        age: formatCacheAge(cachedEntry),
        refreshing: false,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  // Fetch and analyze news for this symbol (top 5 headlines)
  const newsItems = await getAnalyzedNewsForSymbol(symbol, changePct, 5);

  // Get full snapshot data for smart alerts
  const { snapshots } = await getCachedSnapshots([symbol]);
  const snapshot = snapshots[0];

  // Compute smart alerts with full data (synchronous computation)
  const alertFlags = computeSmartAlerts(
    symbol,
    changePct,
    price || 0,
    snapshot?.high52w,
    snapshot?.low52w,
    snapshot?.earningsDate
  );

  // Structure data with ticker-specific news (no cross-ticker noise)
  const payload: ExplainPayload = {
    symbol,
    changePct: Number(changePct.toFixed(2)),
    price: typeof price === "number" ? price : null,
    watchlistName: watchlistName ?? null,
    news: newsItems.map((n) => ({
      title: n.title,
      summary: n.summary,
      publishedAt: n.publishedAt,
      relevanceScore: n.relevanceScore,
      sentiment: n.sentiment,
    })),
    smartAlerts: alertFlags.alerts,
  };

  const systemPrompt = `
      You are an educational market explainer.
      No em dashes or en dashes. No semicolons.

      The user will send you a JSON object with:
      - symbol: the stock ticker
      - changePct: today's percent change (already a percentage, e.g., -0.03 means -0.03%, NOT -3%)
      - price: current price (if available)
      - news: array of recent headlines specific to this symbol only, each with:
        * relevanceScore (0-1): how impactful the news is (1 = highly impactful, 0 = not relevant)
        * sentiment: "positive", "negative", or "neutral" for the stock
      - smartAlerts: array with contextual information (e.g., "near 52-week high", "earnings in 3 days", "hit ±3% move")

      Important: The "news" array contains ONLY headlines for this specific symbol. Do not reference or invent news from other stocks.

      Rules:
      1. Create a structured explanation with:
         - A summary paragraph (2-3 sentences) highlighting the stock movement and key metrics
         - 3-4 key points that break down the major factors
      
      2. SMART ALERTS PRIORITY:
         - If smartAlerts array has items, ALWAYS mention them in the summary
         - Reference the alert context prominently (e.g., "hit a ±3% move today" or "approaching its 52-week high")
         - Order of priority: price_move (critical severity first) > near_52w_high > near_52w_low > earnings_soon
         
      3. Use news array for key points:
         - PRIORITIZE news with HIGH relevanceScore (>0.7) - these are the most impactful
         - Consider the sentiment when explaining: negative sentiment for down moves, positive for up moves
         - Each key point should have a clear, bold-worthy title (e.g., "Earnings Pressure", "Theme Park Growth", "Investor Sentiment")
         - Provide specific details from the headlines in the explanation
         - Do NOT invent details beyond what headlines/summaries state
         - Only use news from the provided array
         - If no news has high relevance scores, acknowledge limited news availability
         
      4. Do NOT give investment advice. Do not tell the user to buy, sell, or hold.
      
      5. Do NOT invent exact dates, numbers, or event names. Only use what's in the JSON.
      
      6. Avoid meta-disclaimers and hedging phrases. Use a neutral, factual tone.
      
      7. Avoid vague jargon unless it appears in the headlines. Focus on concrete events and facts.
      
      8. Do NOT use meta-commentary about the headlines. Talk directly about the company and events.
      
      9. Every point must reference concrete events/facts from the JSON.
`.trim();

  // Initialize LangChain model with structured output
  const model = new ChatOpenAI({
    model: "gpt-5-mini",
  });

  const structuredModel = model.withStructuredOutput(explanationSchema);

  try {
    const result = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(payload) },
    ]);

    // Format the structured output into a readable string
    let formattedExplanation = result.summary + "\n\n";

    result.keyPoints.forEach((point) => {
      formattedExplanation += `• **${point.title}:** ${point.explanation}\n\n`;
    });

    const finalExplanation = formattedExplanation.trim();

    // Cache the result
    await setExplanationInCache(symbol, finalExplanation);

    return NextResponse.json(
      {
        explanation: finalExplanation,
        cached: false,
        age: "Last updated just now",
        refreshing: false,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error("Error generating explanation:", error);
    const fallbackExplanation = "I'm not able to explain this move right now.";
    return NextResponse.json(
      {
        explanation: fallbackExplanation,
        cached: false,
        age: null,
        refreshing: false,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}

/**
 * Background refresh function for stale cache entries
 * This runs asynchronously and updates the cache without blocking the response
 */
async function refreshExplanation(
  symbol: string,
  changePct: number,
  price?: number
): Promise<void> {
  try {
    // Fetch and analyze news
    const newsItems = await getAnalyzedNewsForSymbol(symbol, changePct, 5);

    // Get full snapshot data for smart alerts
    const { snapshots } = await getCachedSnapshots([symbol]);
    const snapshot = snapshots[0];

    // Compute smart alerts
    const alertFlags = computeSmartAlerts(
      symbol,
      changePct,
      price || 0,
      snapshot?.high52w,
      snapshot?.low52w,
      snapshot?.earningsDate
    );

    // Structure data
    const payload: ExplainPayload = {
      symbol,
      changePct: Number(changePct.toFixed(2)),
      price: typeof price === "number" ? price : null,
      watchlistName: null,
      news: newsItems.map((n) => ({
        title: n.title,
        summary: n.summary,
        publishedAt: n.publishedAt,
        relevanceScore: n.relevanceScore,
        sentiment: n.sentiment,
      })),
      smartAlerts: alertFlags.alerts,
    };

    const systemPrompt = `
      You are an educational market explainer.
      No em dashes or en dashes. No semicolons.

      The user will send you a JSON object with:
      - symbol: the stock ticker
      - changePct: today's percent change (already a percentage, e.g., -0.03 means -0.03%, NOT -3%)
      - price: current price (if available)
      - news: array of recent headlines specific to this symbol only, each with:
        * relevanceScore (0-1): how impactful the news is (1 = highly impactful, 0 = not relevant)
        * sentiment: "positive", "negative", or "neutral" for the stock
      - smartAlerts: array with contextual information (e.g., "near 52-week high", "earnings in 3 days", "hit ±3% move")

      Important: The "news" array contains ONLY headlines for this specific symbol. Do not reference or invent news from other stocks.

      Rules:
      1. Create a structured explanation with:
         - A summary paragraph (2-3 sentences) highlighting the stock movement and key metrics
         - 3-4 key points that break down the major factors
      
      2. SMART ALERTS PRIORITY:
         - If smartAlerts array has items, ALWAYS mention them in the summary
         - Reference the alert context prominently (e.g., "hit a ±3% move today" or "approaching its 52-week high")
         - Order of priority: price_move (critical severity first) > near_52w_high > near_52w_low > earnings_soon
         
      3. Use news array for key points:
         - PRIORITIZE news with HIGH relevanceScore (>0.7) - these are the most impactful
         - Consider the sentiment when explaining: negative sentiment for down moves, positive for up moves
         - Each key point should have a clear, bold-worthy title (e.g., "Earnings Pressure", "Theme Park Growth", "Investor Sentiment")
         - Provide specific details from the headlines in the explanation
         - Do NOT invent details beyond what headlines/summaries state
         - Only use news from the provided array
         - If no news has high relevance scores, acknowledge limited news availability
         
      4. Do NOT give investment advice. Do not tell the user to buy, sell, or hold.
      
      5. Do NOT invent exact dates, numbers, or event names. Only use what's in the JSON.
      
      6. Avoid meta-disclaimers and hedging phrases. Use a neutral, factual tone.
      
      7. Avoid vague jargon unless it appears in the headlines. Focus on concrete events and facts.
      
      8. Do NOT use meta-commentary about the headlines. Talk directly about the company and events.
      
      9. Every point must reference concrete events/facts from the JSON.
`.trim();

    // Initialize LangChain model with structured output
    const model = new ChatOpenAI({
      model: "gpt-5-mini",
    });

    const structuredModel = model.withStructuredOutput(explanationSchema);

    const result = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(payload) },
    ]);

    // Format the structured output
    let formattedExplanation = result.summary + "\n\n";
    result.keyPoints.forEach((point) => {
      formattedExplanation += `• **${point.title}:** ${point.explanation}\n\n`;
    });

    const finalExplanation = formattedExplanation.trim();

    // Update cache
    await setExplanationInCache(symbol, finalExplanation);
    console.log(`[Explain] Background refresh completed for ${symbol}`);
  } catch (error) {
    console.error(`[Explain] Background refresh error for ${symbol}:`, error);
    throw error;
  }
}
