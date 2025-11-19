import "server-only";
import type { TickerSnapshot } from "./marketData";
import { getNewsForSymbol, type NewsItem } from "./news";
import { getMacroNews } from "./macroNews";
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

  // Fetch news for all symbols in parallel (top 5 headlines per symbol)
  const newsPromises = snapshots.map((s) => getNewsForSymbol(s.symbol, 5));
  const allNewsArrays = await Promise.all(newsPromises);

  // Fetch macro economic news (top 5 items)
  const macroNews = await getMacroNews(5);

  // Group news by ticker symbol instead of flattening
  const symbolsWithNews: Record<
    string,
    {
      changePct: number;
      price: number;
      news: Array<{
        title: string;
        summary: string;
        publishedAt: string;
      }>;
    }
  > = {};

  snapshots.forEach((snapshot, index) => {
    const newsForSymbol = allNewsArrays[index] || [];
    symbolsWithNews[snapshot.symbol] = {
      changePct: Number(snapshot.changePct.toFixed(2)),
      price: snapshot.price,
      news: newsForSymbol.map((n) => ({
        title: n.title,
        summary: n.summary,
        publishedAt: n.publishedAt,
      })),
    };
  });

  // Build context for LLM with ticker-grouped structure
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
    symbols: symbolsWithNews,
    macroContext: {
      news: macroNews.map((n) => ({
        title: n.title,
        category: n.category,
        impact: n.impact,
        publishedAt: n.publishedAt,
      })),
    },
  };

  const systemPrompt = `
       You are a financial analyst assistant that creates concise, news-driven summaries for a watchlist.

        The user will send you a JSON object with:
        - Watchlist name and basic statistics (number of symbols, up/down counts, average % move)
        - Best and worst performers with prices and % changes
        - A "symbols" object where each ticker is a key, containing:
          - changePct: the stock's % change
          - price: current price
          - news: array of recent headlines (last 1–2 days) specific to that ticker
        - macroContext: object containing macro economic news with:
          - news: array of macro headlines with category (rates, inflation, employment, gdp, policy, geopolitical) and impact level (high, medium, low)
          - Use this to explain broader market moves and provide context for individual stock movements

        Important: News is grouped BY TICKER. Each symbol has its own news array. Do not mix news between tickers.
        Important: Use macroContext news to explain market-wide trends. High-impact macro news (Fed decisions, CPI, jobs) often drives all stocks in a direction.

        Your task is to write a market recap for this watchlist.

        Key Movers & News (1–2 short paragraphs)
        - Focus ONLY on stocks that have both a noticeable move and at least one recent headline in their news array.
          Example style: "Nvidia rose 1.8% after headlines about [X]. Apple slipped 0.2% on reports of [Y]."
        - Do not talk about "these headlines" or "this coverage" in the abstract. Talk directly about the companies and what the news says.
        - Do not include news sources in the summary like SeekingAlpha or any other sources.
        - Only connect news to the ticker it belongs to. If NVDA's news array has 2 items, only use those for NVDA.

        Market Context & Catalysts (1–2 short paragraphs)
        - ALWAYS check macroContext.news first to explain broader market trends
        - If high-impact macro news exists (category: rates, inflation, employment), start with that context
          Example: "Markets moved lower today as the Fed signaled higher rates for longer" or "Stocks rallied after CPI came in below expectations"
        - Link individual stock moves to macro context when relevant
          Example: "Tech stocks like Nvidia and Apple fell alongside the broader market on Fed concerns"
        - Mention upcoming events from individual ticker news (earnings, product launches, FDA decisions)
        - Keep generic forward-looking statements brief if no specific events are mentioned

        
        Style guidelines:
        - Clear, professional, and conversational. Aim for plain English, not Wall Street jargon.
        - Avoid phrases like “these items,” “this coverage,” “themes,” “sentiment,” “narrative,” or “shape sentiment.”
        - Every sentence should refer to specific companies, indexes, prices, moves, or events from the JSON, not vague commentary.
        - Short paragraphs (3-4 sentences each), no bullet points.
        - Never give buy/sell/hold advice.
        - Do not invent tickers, numbers, dates, or headlines; only use provided data.
        - Target roughly 150–200 words total.
        - Do NOT include an overall tone section or restate the watchlist performance. Start directly with the key movers.
        - All company names should be capitalized properly.
        - No em dash or en dash.
        - Do not use meta-commentary about the headlines or news (no "these items", "these news items", "this coverage", etc.). Always talk directly about the company and events.

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
