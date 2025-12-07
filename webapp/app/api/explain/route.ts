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
      "2-3 sentence summary of the stock movement. Be concise and specific."
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
            "1-2 concise sentences explaining this point with specific details"
          ),
      })
    )
    .describe("2-4 most important key points explaining the stock movement"),
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

  // Check cache first (don't clean before checking - we want to serve stale cache)
  const cachedEntry = await getExplanationFromCache(symbol);

  if (cachedEntry) {
    const isStale = isCacheStale(cachedEntry);

    if (isStale) {
      // Cache is stale (>= 30 min old)
      // Return old cache immediately, then refresh in background
      console.log(
        `[Explain] Serving stale cache for ${symbol} (${formatCacheAge(
          cachedEntry
        )}), refreshing in background...`
      );

      // Trigger background refresh asynchronously (don't block response)
      // Use setImmediate/setTimeout to ensure response is sent first
      setTimeout(() => {
        refreshExplanation(symbol, changePct, price).catch((error) => {
          console.error(
            `[Explain] Background refresh failed for ${symbol}:`,
            error
          );
        });
      }, 0);

      // Return cached explanation immediately
      return NextResponse.json(
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
      You are an educational market explainer. BE CONCISE.
      No em dashes or en dashes. No semicolons.

      The user will send you a JSON object with:
      - symbol: the stock ticker
      - changePct: today's percent change (already a percentage, e.g., -0.03 means -0.03%, NOT -3%)
      - price: current price (if available)
      - news: array of recent headlines specific to this symbol only, each with:
        * relevanceScore (0-1): computed by ML model, indicates how relevant the headline is to this specific ticker (1 = highly relevant, 0 = not relevant)
        * sentiment: "positive", "negative", or "neutral" - computed by ML model analyzing the headline tone
      - smartAlerts: array with contextual information (e.g., "near 52-week high", "earnings in 3 days", "hit ±3% move")

      Important: The "news" array contains ONLY headlines for this specific symbol. Do not reference or invent news from other stocks.

      Rules:
      1. BE BRIEF. Keep everything tight:
         - Summary: 2-3 sentences maximum
         - Key points: Only 2-4 most critical factors
         - Each explanation: 1-2 sentences maximum
      
      2. SMART ALERTS PRIORITY:
         - If smartAlerts exist, mention in the summary
         - Be specific: "hit a ±3% move" or "near 52-week high"
         
      3. Use ACTUAL news content directly:
         - Prioritize news with HIGH relevanceScore (>0.7) - these are most relevant to this specific ticker according to ML model
         - **HIGHEST PRIORITY**: Headlines with strong sentiment (< -0.2 or > 0.2) indicating material market impact
         - **HIGHEST PRIORITY**: Material events like earnings reports, product launches, major partnerships, M&A, regulatory news, executive changes, lawsuits, guidance changes
         - **LOWER PRIORITY**: Routine news like insider buying/selling, minor share repurchases, routine SEC filings, generic analyst mentions
         - **LOWER PRIORITY**: Headlines with weak sentiment (between -0.2 and 0.2) that indicate neutral market impact
         - Consider sentiment (positive/negative/neutral) from ML model when explaining market reaction
         - Reference SPECIFIC events, announcements, or developments from the news
         - Use concrete details from headlines/summaries (e.g., "Q4 earnings missed by 8%", "CEO announced layoffs")
         - Do NOT use meta-phrases like "headline states" or "per the provided quote" or "according to reports"
         - Speak directly about what happened (e.g., "The company missed earnings" NOT "Headline states earnings were missed")
         - Do NOT invent details beyond what's in the news
         
      4. No investment advice. No buy/sell/hold recommendations.
      
      5. Only use data from the JSON. No invented dates or numbers.
      
      6. Factual tone. No hedging or disclaimers. Remove dramatic news tone.
      
      7. Every point must cite concrete events from actual news or earnings/dividends reports, not generic market movements.

      8. Do not use any input variable names in the output (e.g., do not use "symbol" or "changePct" or "relevanceScore" or "sentiment" or "provided quote").

      9. Do not repeat similar news items in the key points or repeat the same point.
      
      10. Focus on WHY the stock moved based on specific events, not just describing that it moved.
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
      You are an educational market explainer. BE CONCISE.
      No em dashes or en dashes. No semicolons.

      The user will send you a JSON object with:
      - symbol: the stock ticker
      - changePct: today's percent change (already a percentage, e.g., -0.03 means -0.03%, NOT -3%)
      - price: current price (if available)
      - news: array of recent headlines specific to this symbol only, each with:
        * relevanceScore (0-1): computed by ML model, indicates how relevant the headline is to this specific ticker (1 = highly relevant, 0 = not relevant)
        * sentiment: "positive", "negative", or "neutral" - computed by ML model analyzing the headline tone
      - smartAlerts: array with contextual information (e.g., "near 52-week high", "earnings in 3 days", "hit ±3% move")

      Important: The "news" array contains ONLY headlines for this specific symbol. Do not reference or invent news from other stocks.

      Rules:
      1. BE BRIEF. Keep everything tight:
         - Summary: 2-3 sentences maximum
         - Key points: Only 2-4 most critical factors
         - Each explanation: 1-2 sentences maximum
      
      2. SMART ALERTS PRIORITY:
         - If smartAlerts exist, mention in the summary
         - Be specific: "hit a ±3% move" or "near 52-week high"
         
      3. Use ACTUAL news content directly:
         - Prioritize news with HIGH relevanceScore (>0.7) - these are most relevant to this specific ticker according to ML model
         - **HIGHEST PRIORITY**: Headlines with strong sentiment (< -0.2 or > 0.2) indicating material market impact
         - **HIGHEST PRIORITY**: Material events like earnings reports, product launches, major partnerships, M&A, regulatory news, executive changes, lawsuits, guidance changes
         - **LOWER PRIORITY**: Routine news like insider buying/selling, minor share repurchases, routine SEC filings, generic analyst mentions
         - **LOWER PRIORITY**: Headlines with weak sentiment (between -0.2 and 0.2) that indicate neutral market impact
         - Consider sentiment (positive/negative/neutral) from ML model when explaining market reaction
         - Reference SPECIFIC events, announcements, or developments from the news
         - Use concrete details from headlines/summaries (e.g., "Q4 earnings missed by 8%", "CEO announced layoffs")
         - Do NOT use meta-phrases like "headline states" or "per the provided quote" or "according to reports"
         - Speak directly about what happened (e.g., "The company missed earnings" NOT "Headline states earnings were missed")
         - Do NOT invent details beyond what's in the news
         
      4. No investment advice. No buy/sell/hold recommendations.
      
      5. Only use data from the JSON. No invented dates or numbers.
      
      6. Factual tone. No hedging or disclaimers. Remove dramatic news tone.
      
      7. Every point must cite concrete events from actual news or earnings/dividends reports, not generic market movements.

      8. Do not use any input variable names in the output (e.g., do not use "symbol" or "changePct" or "relevanceScore" or "sentiment" or "provided quote").

      9. Do not repeat similar news items in the key points or repeat the same point.
      
      10. Focus on WHY the stock moved based on specific events, not just describing that it moved.

      11. Do not include the relevanceScore or sentiment in the output.
`.trim();

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

    // Replace old cache with new explanation
    await setExplanationInCache(symbol, finalExplanation);
    console.log(
      `[Explain] Background refresh completed and cache updated for ${symbol}`
    );
  } catch (error) {
    console.error(`[Explain] Background refresh error for ${symbol}:`, error);
    throw error;
  }
}
