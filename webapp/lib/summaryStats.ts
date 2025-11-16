// lib/summaryStats.ts
import type { TickerSnapshot } from "@/lib/marketData";

export type SummaryStats = {
  listName: string;
  total: number;
  upCount: number;
  downCount: number;
  avgChange: number;
  biggestUp: { symbol: string; changePct: number } | null;
  biggestDown: { symbol: string; changePct: number } | null;
};

export function buildSummaryStats(
  listName: string,
  snapshots: TickerSnapshot[]
): SummaryStats {
  if (!snapshots.length) {
    return {
      listName,
      total: 0,
      upCount: 0,
      downCount: 0,
      avgChange: 0,
      biggestUp: null,
      biggestDown: null,
    };
  }

  const up = snapshots.filter((s) => s.changePct > 0);
  const down = snapshots.filter((s) => s.changePct < 0);
  const avgChange =
    snapshots.reduce((sum, s) => sum + s.changePct, 0) / snapshots.length;

  const biggestUp = snapshots.reduce((a, b) =>
    a.changePct > b.changePct ? a : b
  );
  const biggestDown = snapshots.reduce((a, b) =>
    a.changePct < b.changePct ? a : b
  );

  return {
    listName,
    total: snapshots.length,
    upCount: up.length,
    downCount: down.length,
    avgChange,
    biggestUp: {
      symbol: biggestUp.symbol,
      changePct: biggestUp.changePct,
    },
    biggestDown: {
      symbol: biggestDown.symbol,
      changePct: biggestDown.changePct,
    },
  };
}
