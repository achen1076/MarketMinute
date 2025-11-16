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

type ExplainPayload = {
  symbol: string;
  changePct: number;
  price: number | null;
  watchlistName: string | null;
  relatedNews: NewsItem[];
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

  const payload: ExplainPayload = {
    symbol,
    changePct,
    price: typeof price === "number" ? price : null,
    watchlistName: watchlistName ?? null,
    relatedNews,
  };

  const systemPrompt = `
You are an educational market explainer.
No em dashes or en dashes. No semicolons.

The user will send you a JSON object with:
- A stock symbol
- Today's percent change
- Current price (if available)
- An optional watchlist name
- A list of recent news headlines about the stock (may be empty)
- A list of macros (alert rules) the user has defined, and whether they triggered (may be empty)

Rules:
1. Output 2–4 very short, direct sentences. No filler, no rhetorical questions, no greetings.
2. If relatedNews is non-empty, use those headlines as context:
   - You may summarize them.
   - Do NOT invent additional details beyond what the headlines/summary suggest.
3. If relatedNews is empty, explain typical drivers for a move of this size
   (earnings, macro data, sector moves, analyst actions, guidance, etc.), but clearly say these
   are possibilities, not confirmed reasons.
4. Do NOT give investment advice. Do not tell the user to buy, sell, or hold.
5. Do NOT invent exact dates, numbers, or event names. Only use what's in the JSON.
6. Keep it under 120 words, plain text, no bullet points.
7. Avoid meta-disclaimers and hedging phrases like “not confirmed drivers”, “may not directly affect the stock”, or “these headlines may help explain the move”. Just describe the move and context in a neutral, factual tone.

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
