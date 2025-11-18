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
       You are a financial analyst assistant that creates concise, news-driven summaries for a watchlist.

        The user will send you a JSON object with:
        - Watchlist name and basic statistics (number of symbols, up/down counts, average % move)
        - Best and worst performers with prices and % changes
        - All symbols with performance data
        - Recent news headlines (last 1–2 days) for these stocks
        - Optional market and macro data:
          - Overall index or ETF moves for the day (for example: S&P 500, Nasdaq, sector ETFs)
          - Macro headlines (for example: rate expectations, Fed commentary, jobs/CPI data, shutdowns)
          - Upcoming macro events (for example: FOMC meeting, CPI, jobs report, GDP release)

        Your task is to write a market recap for this watchlist.

        Key Movers & News (1–2 short paragraphs)
        - Focus ONLY on stocks that have both a noticeable move and at least one recent headline.
        - For each stock you mention, clearly link the move to the specific headline(s) in simple language.
          Example style: “Nvidia rose 1.8% after headlines about [X]. Apple slipped 0.2% on reports of [Y].”
        - Do not talk about “these headlines” or “this coverage” in the abstract. Talk directly about the companies and what the news says.
        - Do not include news sources in the summary.

        Catalysts & Context (1–2 short paragraphs)
        - Mention upcoming events ONLY if they appear in the headlines or event data (earnings dates, product launches, regulatory decisions, etc.).
        - If there are no explicit future dates or events in the data, write 1–2 sentences that briefly say what investors are likely watching next for these companies (for example, “the next earnings report” or “product updates”), but keep it clearly generic and short.

        Market / Sector Move (1 short paragraph)
        - Use this section to explain the broader market move.
        - If there are no explicit market moves in the data, write 1–2 sentences that briefly say what investors are likely watching next for these companies (for example, “the next earnings report” or “product updates”), but keep it clearly generic and short.
        - Mention and explain Dow, S&P, Nasdaq, and any relevant sector ETFs if they are relevant to the watchlist or moved a lot.

        Style guidelines:
        - Clear, professional, and conversational. Aim for plain English, not Wall Street jargon.
        - Avoid phrases like “these items,” “this coverage,” “themes,” “sentiment,” “narrative,” or “shape sentiment.”
        - Do NOT introduce complex terms like “gamma,” “options positioning,” or “valuation debate” unless they appear directly in the headlines or macro fields.
        - Every sentence should refer to specific companies, indexes, prices, moves, or events from the JSON, not vague commentary.
        - Short paragraphs (3-4 sentences each), no bullet points.
        - Never give buy/sell/hold advice.
        - Do not invent tickers, numbers, dates, or headlines; only use provided data.
        - Target roughly 150–200 words total.
        - Do NOT include an overall tone section or restate the watchlist performance. Start directly with the key movers.
        - All company names should be capitalized properly.
        - No em dash or en dash.
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
