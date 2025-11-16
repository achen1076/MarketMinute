import "server-only";
import type { TickerSnapshot } from "./marketData";
import { getNewsForSymbol, type NewsItem } from "./news";
import { runMiniChat } from "./openai";
import {
  getSummaryFromCache,
  setSummaryInCache,
  cleanExpiredSummaries,
} from "./summaryCache";

export type MarketMinuteSummary = {
  headline: string;
  body: string;
  stats: {
    listName: string;
    totalSymbols: number;
    upCount: number;
    downCount: number;
    best: { symbol: string; changePct: number } | null;
    worst: { symbol: string; changePct: number } | null;
  };
  tickerPerformance: Array<{ symbol: string; changePct: number }>;
};

export async function buildSummary(
  listName: string,
  snapshots: TickerSnapshot[]
): Promise<MarketMinuteSummary> {
  if (snapshots.length === 0) {
    return {
      headline: "No symbols in this watchlist yet.",
      body: "Add some tickers to start getting a daily MarketMinute.",
      stats: {
        listName,
        totalSymbols: 0,
        upCount: 0,
        downCount: 0,
        best: null,
        worst: null,
      },
      tickerPerformance: [],
    };
  }

  // Clean expired cache entries periodically
  cleanExpiredSummaries();

  // Generate cache key from watchlist name and symbols
  const symbolsKey = snapshots
    .map((s) => s.symbol)
    .sort()
    .join(",");

  // Check cache first
  const cachedSummary = getSummaryFromCache(listName, symbolsKey);
  if (cachedSummary) {
    return cachedSummary;
  }

  const up = snapshots.filter((s) => s.changePct > 0);
  const down = snapshots.filter((s) => s.changePct < 0);
  const best = snapshots.reduce((a, b) => (a.changePct > b.changePct ? a : b));
  const worst = snapshots.reduce((a, b) => (a.changePct < b.changePct ? a : b));

  const avgChange =
    snapshots.reduce((sum, s) => sum + s.changePct, 0) / snapshots.length;

  // Fetch news for all symbols in parallel (top 2-3 headlines per symbol)
  const newsPromises = snapshots.map((s) => getNewsForSymbol(s.symbol, 2));
  const allNewsArrays = await Promise.all(newsPromises);
  const allNews = allNewsArrays.flat();

  // Build context for LLM
  const contextPayload = {
    watchlistName: listName,
    totalSymbols: snapshots.length,
    upCount: up.length,
    downCount: down.length,
    avgChange: Number(avgChange.toFixed(2)),
    bestPerformer: {
      symbol: best.symbol,
      changePct: Number(best.changePct.toFixed(2)),
      price: best.price,
    },
    worstPerformer: {
      symbol: worst.symbol,
      changePct: Number(worst.changePct.toFixed(2)),
      price: worst.price,
    },
    allSymbols: snapshots.map((s) => ({
      symbol: s.symbol,
      changePct: Number(s.changePct.toFixed(2)),
      price: s.price,
    })),
    recentNews: allNews.map((n) => ({
      symbol: n.symbol,
      title: n.title,
      summary: n.summary,
      source: n.source,
      publishedAt: n.publishedAt,
    })),
  };

  const systemPrompt = `
        You are a financial analyst assistant that creates concise, data-driven summaries.
        No em dashes or en dashes. No semicolons.

        The user will send you a JSON object with:
            - Watchlist name and basic statistics (number of symbols, up/down counts, average % move)
            - Best and worst performers with prices and % changes
            - All symbols with performance data
            - Recent news headlines (last 1–2 days) for these stocks

        Your task is to write a short market recap for this watchlist:

        Key Movers & News (1–2 short paragraphs)
        Focus on the biggest movers and any symbols with meaningful, recent headlines. Connect price moves to the headlines when it clearly makes sense. Only reference news that appears in the JSON. Do not invent events or details.

        Catalysts & Context (1 short paragraph)
        If the news mentions upcoming earnings, product launches, or dates, call them out. If not, briefly mention typical upcoming catalysts for these types of companies (earnings, guidance, macro data), but clearly as things to watch, not as predictions.

        Macro / Sector View (1 short paragraph)
        Give a high-level view of broader market or sector themes that could reasonably affect this watchlist (rates, tech strength/weakness, consumer demand, etc.). Keep it generic and clearly labeled as context, not as specific explanation for individual moves.

        Style guidelines:
            - Clear, professional, and conversational.
            - Short paragraphs (2–3 sentences each), no bullet points.
            - Be dense and informative; avoid filler phrases.
            - Never give buy/sell/hold advice.
            - Do not invent tickers, numbers, dates, or headlines; only use provided data.
            - Target roughly 150–250 words total.
            - Do NOT include an overall tone section or describe the watchlist's overall performance. Jump straight into the key movers.
        Return ONLY the narrative text, no JSON, no preamble.
`.trim();

  const body = await runMiniChat({
    system: systemPrompt,
    user: JSON.stringify(contextPayload, null, 2),
  });

  let headline: string = "Market Summary";

  const summary: MarketMinuteSummary = {
    headline,
    body:
      body ||
      "Unable to generate summary at this time. Please try again later.",
    stats: {
      listName,
      totalSymbols: snapshots.length,
      upCount: up.length,
      downCount: down.length,
      best: { symbol: best.symbol, changePct: best.changePct },
      worst: { symbol: worst.symbol, changePct: worst.changePct },
    },
    tickerPerformance: snapshots.map((s) => ({
      symbol: s.symbol,
      changePct: s.changePct,
    })),
  };

  // Cache the result
  setSummaryInCache(listName, symbolsKey, summary);

  return summary;
}
