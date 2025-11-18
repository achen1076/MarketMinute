"use client";

import { useEffect, useState } from "react";
import Card from "@/components/atoms/Card";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

type Mover = {
  symbol: string;
  lastPrice: number;
  currentPrice: number;
  priceChange: number;
  priceChangePct: number;
};

type SnapshotComparison = {
  hasSnapshot: boolean;
  lastVisit?: string;
  avgPriceChangePct?: number;
  topMovers?: Mover[];
  allChanges?: Mover[];
};

type Props = {
  watchlistId: string;
  userId: string;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function SinceLastVisit({ watchlistId, userId }: Props) {
  const [data, setData] = useState<SnapshotComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/visit-snapshot?watchlistId=${watchlistId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch comparison");
        }

        const result = await response.json();
        setData(result);

        // Create a snapshot for next time
        // - On first visit (no snapshot): create initial snapshot
        // - On subsequent visits (has snapshot): create new snapshot after comparison
        await fetch("/api/visit-snapshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchlistId }),
        });
      } catch (error) {
        console.error("Error fetching visit comparison:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [watchlistId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 w-48 rounded bg-slate-800"></div>
          <div className="mt-2 h-3 w-64 rounded bg-slate-800"></div>
        </div>
      </Card>
    );
  }

  if (!data?.hasSnapshot) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Clock className="text-slate-400" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              First time viewing this watchlist
            </h3>
            <p className="text-sm text-slate-400">
              We'll track changes from now on.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const { lastVisit, avgPriceChangePct, topMovers, allChanges } = data;
  const isFlat = Math.abs(avgPriceChangePct || 0) < 0.01;
  const hasNoMeaningfulMoves =
    allChanges?.every((m) => Math.abs(m.priceChangePct) < 0.2) ?? true;

  return (
    <Card
      className="p-6 transition-all hover:bg-slate-900/20 cursor-pointer"
      title="Click to view detailed comparison (coming soon)"
    >
      <div className="flex items-start gap-3">
        <Clock className="mt-1 shrink-0 text-teal-500" size={20} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-200">
            Since you last checked ({lastVisit && formatTimeAgo(lastVisit)})
          </h3>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-slate-400">Watchlist:</span>
              <span
                className={`text-lg font-semibold ${
                  isFlat
                    ? "text-slate-400"
                    : avgPriceChangePct! >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {avgPriceChangePct! >= 0 ? "+" : ""}
                {avgPriceChangePct!.toFixed(2)}%
              </span>
            </div>

            {topMovers && topMovers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">
                  {hasNoMeaningfulMoves
                    ? "No meaningful moves since you last checked"
                    : "Biggest movers:"}
                </p>
                <div className="flex flex-wrap gap-3">
                  {topMovers.map((mover) => {
                    const isMoverFlat = Math.abs(mover.priceChangePct) === 0;
                    return (
                      <button
                        key={mover.symbol}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                          isMoverFlat
                            ? "bg-slate-900/40 opacity-60"
                            : "bg-slate-900/60 hover:bg-slate-800/80"
                        }`}
                        title={`View ${mover.symbol} details (coming soon)`}
                      >
                        {mover.priceChangePct >= 0 ? (
                          <TrendingUp
                            size={14}
                            className={
                              isMoverFlat
                                ? "text-slate-500"
                                : "text-emerald-400"
                            }
                          />
                        ) : (
                          <TrendingDown
                            size={14}
                            className={
                              isMoverFlat ? "text-slate-500" : "text-rose-400"
                            }
                          />
                        )}
                        <span
                          className={`font-mono text-sm font-semibold ${
                            isMoverFlat ? "text-slate-500" : "text-slate-200"
                          }`}
                        >
                          {mover.symbol}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            isMoverFlat
                              ? "text-slate-500"
                              : mover.priceChangePct >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {mover.priceChangePct >= 0 ? "+" : ""}
                          {mover.priceChangePct.toFixed(2)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
