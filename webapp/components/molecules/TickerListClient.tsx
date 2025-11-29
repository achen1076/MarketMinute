"use client";

import { useState, useEffect, useMemo } from "react";
import type { TickerSnapshot } from "@/lib/marketData";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import { MiniSparkline } from "@/components/atoms/MiniSparkline";
import { RefreshCw, Search, Star } from "lucide-react";
import { CACHE_TTL_MS } from "@/lib/constants";
import ReactMarkdown from "react-markdown";
import { isMarketOpen } from "@/lib/marketHours";

type EnrichedSnapshot = TickerSnapshot & {
  isFavorite?: boolean;
  itemId?: string | null;
};

type Props = {
  snapshots: EnrichedSnapshot[];
  watchlistId?: string | null;
};

export function TickerListClient({
  snapshots: initialSnapshots,
  watchlistId,
}: Props) {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explanationMeta, setExplanationMeta] = useState<
    Record<string, { age: string | null; refreshing: boolean }>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteTogglingId, setFavoriteTogglingId] = useState<string | null>(
    null
  );
  const [sortMode, setSortMode] = useState<
    "a-z" | "highest-gain" | "highest-loss"
  >("a-z");
  const [flashingSymbols, setFlashingSymbols] = useState<Set<string>>(
    new Set()
  );
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>(
    {}
  );
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>(
    {}
  );

  useEffect(() => {
    // Track price changes and trigger flash animations
    const changedSymbols = new Set<string>();
    initialSnapshots.forEach((snapshot) => {
      const prevPrice = previousPrices[snapshot.symbol];
      if (prevPrice && prevPrice !== snapshot.price) {
        changedSymbols.add(snapshot.symbol);
      }
    });

    if (changedSymbols.size > 0) {
      setFlashingSymbols(changedSymbols);
      setTimeout(() => setFlashingSymbols(new Set()), 600);
    }

    // Update prices and history
    const newPrices: Record<string, number> = {};
    const newHistory: Record<string, number[]> = { ...priceHistory };

    initialSnapshots.forEach((s) => {
      newPrices[s.symbol] = s.price;

      // Maintain last 10 price points for sparkline
      if (!newHistory[s.symbol]) {
        newHistory[s.symbol] = [s.price];
      } else {
        newHistory[s.symbol] = [...newHistory[s.symbol], s.price].slice(-10);
      }
    });

    setPreviousPrices(newPrices);
    setPriceHistory(newHistory);
    setSnapshots(initialSnapshots);
  }, [initialSnapshots]);

  const handleRefresh = async () => {
    if (!watchlistId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/snapshots?watchlistId=${watchlistId}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots);
      }
    } catch (error) {
      console.error("Failed to fetch snapshots:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!watchlistId) return;

    handleRefresh();

    // Only set up polling if market is currently open
    if (!isMarketOpen()) {
      return; // No polling outside market hours
    }

    const interval = setInterval(() => {
      if (isMarketOpen()) {
        handleRefresh();
      }
    }, CACHE_TTL_MS);

    return () => clearInterval(interval);
  }, [watchlistId]);

  const handleFavoriteToggle = async (snapshot: EnrichedSnapshot) => {
    if (!snapshot.itemId || favoriteTogglingId) return;

    setFavoriteTogglingId(snapshot.itemId);
    try {
      const res = await fetch("/api/watchlist-items/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: snapshot.itemId,
          isFavorite: !snapshot.isFavorite,
        }),
      });

      if (res.ok) {
        // Optimistically update the UI
        setSnapshots((prev) =>
          prev.map((s) =>
            s.symbol === snapshot.symbol
              ? { ...s, isFavorite: !s.isFavorite }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setFavoriteTogglingId(null);
    }
  };

  async function handleExplainToggle(s: EnrichedSnapshot) {
    const hasExplanation = !!explanations[s.symbol];

    if (hasExplanation) {
      setExplanations((prev) => {
        const next = { ...prev };
        delete next[s.symbol];
        return next;
      });
      setExplanationMeta((prev) => {
        const next = { ...prev };
        delete next[s.symbol];
        return next;
      });
      return;
    }

    setLoadingSymbol(s.symbol);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: s.symbol,
          changePct: s.changePct,
          price: s.price,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setExplanations((prev) => ({
        ...prev,
        [s.symbol]: data.explanation as string,
      }));
      setExplanationMeta((prev) => ({
        ...prev,
        [s.symbol]: {
          age: data.age || null,
          refreshing: data.refreshing || false,
        },
      }));
    } finally {
      setLoadingSymbol(null);
    }
  }

  // Filter and sort snapshots
  const filteredAndSortedSnapshots = useMemo(() => {
    // Filter by search query
    let filtered = snapshots.filter((s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort based on mode
    switch (sortMode) {
      case "a-z":
        filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
      case "highest-gain":
        filtered.sort((a, b) => b.changePct - a.changePct);
        break;
      case "highest-loss":
        filtered.sort((a, b) => a.changePct - b.changePct);
        break;
    }

    // Always sort favorited stocks to the top
    filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });

    return filtered;
  }, [snapshots, searchQuery, sortMode]);

  return (
    <Card className="p-4 text-sm h-full overflow-hidden flex flex-col">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-slate-200">Your Symbols</h3>
        {/* <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-800/50 disabled:opacity-50"
          title="Refresh prices"
        >
          <RefreshCw
            size={16}
            className={`text-slate-400 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button> */}
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-3 shrink-0">
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-slate-600"
          >
            <option value="a-z">A-Z</option>
            <option value="highest-gain">Highest Gain</option>
            <option value="highest-loss">Highest Loss</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
        {filteredAndSortedSnapshots.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            {searchQuery
              ? "No symbols match your search"
              : "No symbols to display"}
          </div>
        ) : (
          filteredAndSortedSnapshots.map((s) => {
            const hasExplanation = !!explanations[s.symbol];

            const isFlashing = flashingSymbols.has(s.symbol);
            const priceChangeClass =
              s.changePct > 0 ? "from-emerald-500/20" : "from-rose-500/20";

            return (
              <div
                key={s.symbol}
                className={`flex flex-col rounded-lg px-3 py-3 transition-all relative overflow-hidden ${
                  s.isFavorite
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-slate-900/60"
                }`}
              >
                {isFlashing && (
                  <div
                    className={`absolute inset-0 bg-linear-to-r ${priceChangeClass} to-transparent animate-pulse pointer-events-none`}
                    style={{ animation: "pulse 0.6s ease-out" }}
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => handleFavoriteToggle(s)}
                      disabled={favoriteTogglingId === s.itemId}
                      className="shrink-0 p-1 rounded hover:bg-slate-800/50 transition-colors disabled:opacity-50"
                      title={s.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                      <Star
                        size={16}
                        className={`transition-colors cursor-pointer ${
                          s.isFavorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-500 hover:text-amber-400"
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-slate-100">
                          {s.symbol}
                          {s.isFavorite && (
                            <span className="ml-2 text-xs text-amber-400">
                              ★
                            </span>
                          )}
                        </div>
                        {priceHistory[s.symbol] &&
                          priceHistory[s.symbol].length >= 2 && (
                            <MiniSparkline
                              data={priceHistory[s.symbol]}
                              width={40}
                              height={16}
                            />
                          )}
                      </div>
                      <div
                        className={`text-md text-slate-200 transition-all ${
                          isFlashing
                            ? s.changePct > 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                            : ""
                        }`}
                      >
                        ${s.price.toFixed(2)}
                      </div>
                      {s.isFavorite && s.earningsDate && (
                        <div className="text-xs text-amber-400/80 mt-1">
                          📅 Earnings: {s.earningsDate}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold shrink-0 ${
                      s.changePct > 0
                        ? "text-emerald-400"
                        : s.changePct < 0
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {s.changePct > 0 ? "+" : ""}
                    {s.changePct.toFixed(2)}%
                  </div>
                </div>

                <div className="mt-2">
                  <button
                    onClick={() => handleExplainToggle(s)}
                    disabled={loadingSymbol === s.symbol}
                    className="text-sm py-1 px-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700/50"
                  >
                    {loadingSymbol === s.symbol
                      ? "Explaining..."
                      : hasExplanation
                      ? "Close"
                      : "Explain move"}
                  </button>
                </div>

                {hasExplanation && (
                  <div className="mt-3 rounded bg-slate-800/50 p-3 text-sm leading-relaxed text-slate-300 prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-3 last:mb-0">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-slate-100">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="space-y-2 list-none">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="pl-0">{children}</li>
                        ),
                      }}
                    >
                      {explanations[s.symbol]}
                    </ReactMarkdown>
                    {explanationMeta[s.symbol]?.age && (
                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                        <span>{explanationMeta[s.symbol].age}</span>
                        {explanationMeta[s.symbol].refreshing && (
                          <span className="flex items-center gap-1 text-amber-400/70">
                            <svg
                              className="animate-spin h-3 w-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Refreshing...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
