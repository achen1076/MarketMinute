"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { TickerSnapshot } from "@/lib/marketData";
import Card from "@/components/atoms/Card";
import { Search, Star, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { CACHE_TTL_MS } from "@/lib/constants";
import ReactMarkdown from "react-markdown";
import { isMarketOpen, isAfterHours, isPreMarket } from "@/lib/marketHours";
import { TickerChart } from "@/components/molecules/TickerChart";
import { TICKER_TO_COMPANY } from "@/lib/tickerMappings";

interface TickerAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  symbol: string;
  severity: string;
  createdAt: string;
}

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
  const [alerts, setAlerts] = useState<TickerAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(
    new Set()
  );
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsDropdownRef = useRef<HTMLDivElement>(null);
  const alertsFetchInitiated = useRef<string | null>(null);
  const [expandedSymbols, setExpandedSymbols] = useState<Set<string>>(
    new Set()
  );
  const [rateLimitError, setRateLimitError] = useState<{
    symbol: string;
    retryAfter: number;
  } | null>(null);

  const activeAlerts = alerts.filter((a) => !dismissedAlertIds.has(a.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        alertsDropdownRef.current &&
        !alertsDropdownRef.current.contains(event.target as Node)
      ) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!watchlistId) {
      setAlerts([]);
      return;
    }

    // Prevent duplicate fetch for same watchlistId
    if (alertsFetchInitiated.current === watchlistId) return;
    alertsFetchInitiated.current = watchlistId;

    const fetchAlerts = async () => {
      try {
        const res = await fetch(`/api/alerts?watchlistId=${watchlistId}`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };

    fetchAlerts();
  }, [watchlistId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-rose-500/50 bg-rose-500/10";
      case "medium":
        return "border-amber-500/50 bg-amber-500/10";
      default:
        return "border-teal-500/50 bg-teal-500/10";
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-rose-400";
      case "medium":
        return "text-amber-400";
      default:
        return "text-teal-400";
    }
  };

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

    // Refresh during market hours or extended hours (premarket/postmarket)
    const shouldRefresh = isMarketOpen() || isAfterHours() || isPreMarket();
    if (!shouldRefresh) {
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (
          document.visibilityState === "visible" &&
          (isMarketOpen() || isAfterHours() || isPreMarket())
        ) {
          handleRefresh();
        }
      }, CACHE_TTL_MS);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (isMarketOpen() || isAfterHours() || isPreMarket()) {
          handleRefresh();
          startPolling();
        }
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

    setExpandedSymbols((prev) => {
      const next = new Set(prev);
      next.delete(s.symbol);
      return next;
    });

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

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json();
          setRateLimitError({
            symbol: s.symbol,
            retryAfter: data.retryAfter || 60,
          });
          setTimeout(() => setRateLimitError(null), 5000);
        }
        return;
      }

      const data = await res.json();
      setExplanations((prev) => ({
        ...prev,
        [s.symbol]: data.explanation as string,
      }));
      setExplanationMeta((prev) => ({
        ...prev,
        [s.symbol]: {
          age: data.age || null,
          refreshing: false,
        },
      }));
      setExpandedSymbols((prev) => {
        const next = new Set(prev);
        next.delete(s.symbol);
        return next;
      });
    } finally {
      setLoadingSymbol(null);
    }
  }

  const filteredAndSortedSnapshots = useMemo(() => {
    let filtered = snapshots.filter((s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

  const formatTimestamp = (
    unixTimestamp: number | undefined,
    includeSeconds: boolean
  ) => {
    if (!unixTimestamp) return "";

    const ms =
      unixTimestamp > 9999999999 ? unixTimestamp : unixTimestamp * 1000;
    const date = new Date(ms);
    const now = new Date();

    const isToday = now.getDate() === date.getDate();

    return date.toLocaleTimeString("en-US", {
      month: isToday ? undefined : "short",
      day: isToday ? undefined : "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: includeSeconds ? "2-digit" : undefined,
    });
  };

  return (
    <Card className="p-4 text-sm h-full overflow-hidden flex flex-col">
      <div className="mb-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground/80">
            Your Symbols
          </h3>

          {/* Alerts Bell Icon + Dropdown */}
          <div className="relative" ref={alertsDropdownRef}>
            <button
              onClick={() => setAlertsOpen(!alertsOpen)}
              className="relative p-2 rounded-lg transition-colors hover:bg-slate-700/50"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5 text-slate-400" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {activeAlerts.length > 9 ? "9+" : activeAlerts.length}
                </span>
              )}
            </button>

            {alertsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border shadow-xl z-50 bg-card border-border">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Alerts</h3>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {activeAlerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No alerts for this watchlist
                    </div>
                  ) : (
                    activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="px-4 py-3 border-b border-border cursor-pointer transition-colors hover:bg-muted/50 bg-muted/30"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                              alert.severity === "high"
                                ? "bg-rose-400"
                                : alert.severity === "medium"
                                ? "bg-amber-400"
                                : "bg-teal-400"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium ${getSeverityTextColor(
                                  alert.severity
                                )}`}
                              >
                                {alert.title}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {alert.symbol}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {activeAlerts.length > 0 && (
                  <div className="px-4 py-2 border-t border-border text-center">
                    <button
                      onClick={() => setAlertsOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate Limit Warning */}
      {rateLimitError && (
        <div className="mb-3 shrink-0 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
          <span className="shrink-0">⚠️</span>
          <span>
            Too many requests. Please wait {rateLimitError.retryAfter}s before
            trying again.
          </span>
        </div>
      )}

      {/* Search and Sort Controls */}
      <div className="mb-3 shrink-0">
        <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background/50 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="a-z">A-Z</option>
            <option value="highest-gain">Highest Gain</option>
            <option value="highest-loss">Highest Loss</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
        {filteredAndSortedSnapshots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
                    : "bg-muted/60"
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
                      className="shrink-0 p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
                      title={s.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                      <Star
                        size={16}
                        className={`transition-colors cursor-pointer ${
                          s.isFavorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground hover:text-amber-400"
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="font-medium text-foreground">
                          {s.symbol}
                          {s.isFavorite && (
                            <span className="ml-2 text-xs text-amber-400">
                              ★
                            </span>
                          )}
                        </div>
                        {s.extendedHoursSession && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-medium">
                            {s.extendedHoursSession === "premarket"
                              ? "Pre-market"
                              : "After-hours"}
                          </span>
                        )}
                      </div>
                      {TICKER_TO_COMPANY[s.symbol.toUpperCase()]?.[0] ? (
                        <div className="text-xs text-muted-foreground -mt-0.5 mb-1">
                          {TICKER_TO_COMPANY[s.symbol.toUpperCase()][0]}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground -mt-0.5 mb-1">
                          {s.symbol}
                        </div>
                      )}
                      <div
                        className={`text-md text-foreground/90 transition-all ${
                          isFlashing
                            ? s.changePct > 0
                              ? "text-emerald-500 dark:text-emerald-400"
                              : "text-red-500 dark:text-rose-400"
                            : ""
                        }`}
                      >
                        ${s.price.toFixed(2)}
                      </div>
                      {s.extendedHoursSession &&
                        s.extendedHoursPrice !== undefined && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                            <span className="text-xs text-violet-400">
                              {s.extendedHoursSession === "premarket"
                                ? "Pre-market"
                                : "After-hours"}
                              : ${s.extendedHoursPrice.toFixed(2)}
                            </span>
                            {s.extendedHoursChangePct !== undefined && (
                              <span
                                className={`text-xs font-medium ${
                                  s.extendedHoursChangePct >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {s.extendedHoursChangePct >= 0 ? "+" : ""}
                                {s.extendedHoursChangePct.toFixed(2)}%
                              </span>
                            )}
                            {s.extendedHoursTimestamp && (
                              <span className="text-[10px] text-muted-foreground">
                                {formatTimestamp(
                                  s.extendedHoursTimestamp,
                                  false
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      {s.isFavorite && s.earningsDate && (
                        <div className="text-xs text-amber-400/80 mt-1">
                          📅 Earnings: {s.earningsDate}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-semibold ${
                        s.changePct > 0
                          ? "text-emerald-500 dark:text-emerald-400"
                          : s.changePct < 0
                          ? "text-red-500 dark:text-rose-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.changePct > 0 ? "+" : ""}
                      {s.changePct.toFixed(2)}%
                    </div>
                    {s.extendedHoursSession ? (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {s.extendedHoursSession === "premarket"
                          ? "prev close"
                          : "at close"}
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {s.timestamp ? formatTimestamp(s.timestamp, true) : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => handleExplainToggle(s)}
                    disabled={loadingSymbol === s.symbol}
                    className="text-xs text-muted-foreground/70 hover:text-foreground hover:underline transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loadingSymbol === s.symbol
                      ? "Explaining..."
                      : hasExplanation
                      ? "Close"
                      : "↳ Why this moved"}
                  </button>
                  <button
                    onClick={() => {
                      // Close explanation when opening expanded data
                      if (!expandedSymbols.has(s.symbol)) {
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
                      }

                      setExpandedSymbols((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.symbol)) {
                          next.delete(s.symbol);
                        } else {
                          next.add(s.symbol);
                        }
                        return next;
                      });
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
                  >
                    {expandedSymbols.has(s.symbol) ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>

                {hasExplanation && (
                  <div className="mt-3 rounded bg-muted/50 p-3 text-sm leading-relaxed text-foreground/80 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-3 last:mb-0">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">
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
                      <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
                        <span>{explanationMeta[s.symbol].age}</span>
                      </div>
                    )}
                  </div>
                )}

                {expandedSymbols.has(s.symbol) && (
                  <div className="mt-3 rounded bg-muted/50 p-3 space-y-4">
                    {/* Chart */}
                    <div className="pb-3 border-b border-slate-700/50">
                      <TickerChart
                        symbol={s.symbol}
                        currentPrice={s.price}
                        changePct={s.changePct}
                        previousClose={s.previousClose}
                      />
                    </div>

                    {/* Extended Hours Bid/Ask */}
                    {s.extendedHoursSession &&
                      (s.extendedHoursBid !== undefined ||
                        s.extendedHoursAsk !== undefined) && (
                        <div className="pb-3 border-b border-slate-700/50">
                          <div className="text-xs text-violet-400 font-medium mb-2">
                            {s.extendedHoursSession === "premarket"
                              ? "Pre-market"
                              : "After-hours"}{" "}
                            Quote
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {s.extendedHoursBid !== undefined &&
                              s.extendedHoursBidSize !== undefined && (
                                <div>
                                  <div className="text-slate-500">Bid</div>
                                  <div className="text-emerald-400 font-medium">
                                    ${s.extendedHoursBid.toFixed(2)} x{" "}
                                    {s.extendedHoursBidSize.toLocaleString()}
                                  </div>
                                </div>
                              )}
                            {s.extendedHoursAsk !== undefined &&
                              s.extendedHoursAskSize !== undefined && (
                                <div>
                                  <div className="text-slate-500">Ask</div>
                                  <div className="text-rose-400 font-medium">
                                    ${s.extendedHoursAsk.toFixed(2)} x{" "}
                                    {s.extendedHoursAskSize.toLocaleString()}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {s.marketCap !== undefined && (
                        <div>
                          <div className="text-slate-500">Market Cap</div>
                          <div className="text-slate-200 font-medium">
                            $
                            {s.marketCap >= 1e12
                              ? (s.marketCap / 1e12).toFixed(2) + "T"
                              : (s.marketCap / 1e9).toFixed(2) + "B"}
                          </div>
                        </div>
                      )}
                      {s.volume !== undefined && (
                        <div>
                          <div className="text-slate-500">Volume</div>
                          <div className="text-slate-200 font-medium">
                            {(s.volume / 1e6).toFixed(2)}M
                          </div>
                        </div>
                      )}
                      {s.avgVolume !== undefined && (
                        <div>
                          <div className="text-slate-500">Avg Volume</div>
                          <div className="text-slate-200 font-medium">
                            {(s.avgVolume / 1e6).toFixed(2)}M
                          </div>
                        </div>
                      )}
                      {/* {s.pe !== undefined && s.pe !== null && (
                        <div>
                          <div className="text-slate-500">P/E Ratio</div>
                          <div className="text-slate-200 font-medium">
                            {s.pe.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {s.eps !== undefined && s.eps !== null && (
                        <div>
                          <div className="text-slate-500">EPS</div>
                          <div className="text-slate-200 font-medium">
                            ${s.eps.toFixed(2)}
                          </div>
                        </div>
                      )} */}
                      {s.open !== undefined && (
                        <div>
                          <div className="text-slate-500">Open</div>
                          <div className="text-slate-200 font-medium">
                            ${s.open.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {s.previousClose !== undefined && (
                        <div>
                          <div className="text-slate-500">Prev Close</div>
                          <div className="text-slate-200 font-medium">
                            ${s.previousClose.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {s.dayLow !== undefined && (
                        <div>
                          <div className="text-slate-500">Day Low</div>
                          <div className="text-slate-200 font-medium">
                            ${s.dayLow.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {s.dayHigh !== undefined && (
                        <div>
                          <div className="text-slate-500">Day High</div>
                          <div className="text-slate-200 font-medium">
                            ${s.dayHigh.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {s.high52w !== undefined && (
                        <div>
                          <div className="text-slate-500">52W High</div>
                          <div className="text-slate-200 font-medium">
                            ${s.high52w.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {s.low52w !== undefined && (
                        <div>
                          <div className="text-slate-500">52W Low</div>
                          <div className="text-slate-200 font-medium">
                            ${s.low52w.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
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
