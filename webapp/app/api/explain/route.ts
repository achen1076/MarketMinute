// app/api/explain/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runMiniChat } from "@/lib/openai";
import { getNewsForSymbol, NewsItem } from "@/lib/news";
import {
  getExplanationFromCache,
  setExplanationInCache,
  cleanExpiredExplanations,
} from "@/lib/explainCache";
import { computeSmartAlerts, SmartAlert } from "@/lib/smartAlerts";
import { getSnapshotsForSymbols } from "@/lib/marketData";

type ExplainPayload = {
  symbol: string;
  changePct: number;
  price: number | null;
  watchlistName: string | null;
  relatedNews: NewsItem[];
  smartAlerts: SmartAlert[];
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { symbol, changePct, price, watchlistName } = body as {
    symbol: string;
    changePct: number;
    price?: number;
    watchlistName?: string;
  };

  // Clean expired cache entries periodically
  cleanExpiredExplanations();

  // Check cache first
  const cachedExplanation = getExplanationFromCache(symbol);
  if (cachedExplanation) {
    return NextResponse.json({
      explanation: cachedExplanation,
      cached: true,
    });
  }

  const relatedNews = await getNewsForSymbol(symbol, 3);

  // Get full snapshot data for smart alerts
  const snapshots = await getSnapshotsForSymbols([symbol]);
  const snapshot = snapshots[0];

  // Compute smart alerts with full data
  const alertFlags = await computeSmartAlerts(
    symbol,
    changePct,
    price || 0,
    snapshot?.high52w,
    snapshot?.low52w,
    snapshot?.earningsDate
  );

  const payload: ExplainPayload = {
    symbol,
    changePct,
    price: typeof price === "number" ? price : null,
    watchlistName: watchlistName ?? null,
    relatedNews,
    smartAlerts: alertFlags.alerts,
  };

  const systemPrompt = `
      You are an educational market explainer.
      No em dashes or en dashes. No semicolons.

      The user will send you a JSON object with:
      - A stock symbol
      - Today's percent change (IMPORTANT: "changePct" is already a percentage. For example, -0.03 means -0.03%, NOT -3%) round it to 2 decimal places
      - Current price (if available)
      - A list of recent news headlines about the stock (may be empty)
      - A list of smartAlerts with contextual information (e.g., "near 52-week high", "earnings in 3 days", "hit ±3% move")

      Rules:
      1. Output 3–4 very short, direct sentences. No filler, no rhetorical questions, no greetings.
      
      2. SMART ALERTS PRIORITY:
         - If smartAlerts array has items, ALWAYS start your response by mentioning them
         - Opening sentence should reference the alert context (e.g., "${symbol} hit a ±3% move today" or "${symbol} is approaching its 52-week high")
         - Order of priority: price_move (critical severity first) > near_52w_high > near_52w_low > earnings_soon
         - Weave alert details naturally into your explanation
         
      3. After alerts, use relatedNews if available:
         - Summarize key points from headlines
         - Do NOT invent details beyond what headlines/summaries state
         - Connect news to the price move when relevant
         
      4. Do NOT give investment advice. Do not tell the user to buy, sell, or hold.
      
      5. Do NOT invent exact dates, numbers, or event names. Only use what's in the JSON.
      
      6. Avoid meta-disclaimers and hedging phrases like "not confirmed drivers", "may not directly affect the stock", or "these headlines may help explain the move". Just describe the move and context in a neutral, factual tone.
      
      7. Avoid vague commentary and finance jargon such as "coverage," "debate over valuation," "brand resilience," "investor sentiment," "Wall Street narrative," "market is digesting," etc., unless those exact words appear in a headline or summary. Do not describe how investors feel or what "coverage highlights"; talk only about the concrete topics mentioned.
      
      8. Do NOT use meta-commentary about the headlines or news (no "these items", "these news items", "this coverage", etc.). Always talk directly about the company and events.
      
      9. Every sentence must mention a concrete event/fact from the JSON. No generic filler sentences.
      
      10. Keep it under 120 words, plain text, no bullet points.

`.trim();

  const explanation = await runMiniChat({
    system: systemPrompt,
    user: JSON.stringify(payload),
  });

  const finalExplanation =
    explanation || "I'm not able to explain this move right now.";

  // Cache the result
  setExplanationInCache(symbol, finalExplanation);

  return NextResponse.json({
    explanation: finalExplanation,
    cached: false,
  });
}
