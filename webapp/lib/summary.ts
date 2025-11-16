import type { TickerSnapshot } from "./marketData";

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
};

export function buildSummary(
  listName: string,
  snapshots: TickerSnapshot[]
): MarketMinuteSummary {
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
    };
  }

  const up = snapshots.filter((s) => s.changePct > 0);
  const down = snapshots.filter((s) => s.changePct < 0);
  const best = snapshots.reduce((a, b) => (a.changePct > b.changePct ? a : b));
  const worst = snapshots.reduce((a, b) => (a.changePct < b.changePct ? a : b));

  const avgChange =
    snapshots.reduce((sum, s) => sum + s.changePct, 0) / snapshots.length;

  let headline: string;
  if (avgChange > 1) headline = "Your watchlist is having a strong day.";
  else if (avgChange < -1) headline = "Rough day for your watchlist.";
  else headline = "Pretty flat day overall.";

  const body =
    `${up.length} of ${snapshots.length} names are green. ` +
    `Biggest winner: ${best.symbol} (${best.changePct.toFixed(
      2
    )}%). Biggest loser: ${worst.symbol} (${worst.changePct.toFixed(
      2
    )}%). Average move is ${avgChange.toFixed(2)}%.`;

  return {
    headline,
    body,
    stats: {
      listName,
      totalSymbols: snapshots.length,
      upCount: up.length,
      downCount: down.length,
      best: { symbol: best.symbol, changePct: best.changePct },
      worst: { symbol: worst.symbol, changePct: worst.changePct },
    },
  };
}
