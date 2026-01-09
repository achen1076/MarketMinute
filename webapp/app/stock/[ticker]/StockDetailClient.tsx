"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/atoms/Card";
import { TickerChart } from "@/components/molecules/TickerChart";
import { MarketIndices } from "@/components/molecules/MarketIndices";
import { CACHE_TTL_MS } from "@/lib/constants";
import { isMarketOpen, isAfterHours, isPreMarket } from "@/lib/marketHours";
import { Lightbulb, X, Search, RefreshCw, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { TickerSnapshot } from "@/lib/marketData";
import { AddToWatchlistModal } from "@/components/molecules/AddToWatchlistModal";
import { StockNews } from "@/components/molecules/StockNews";

type Props = {
  ticker: string;
  displayName?: string;
};

export default function StockDetailClient({ ticker, displayName }: Props) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<TickerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Explanation state
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationMeta, setExplanationMeta] = useState<{
    age: string | null;
    refreshing: boolean;
  } | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<{
    retryAfter: number;
  } | null>(null);

  // Watchlist modal state
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);

  // Prefer snapshot name (from FMP API), fallback to displayName prop, then ticker
  const companyName = snapshot?.name || displayName || ticker;
  const isIndex = ticker.startsWith("^");

  const fetchSnapshot = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetch(`/api/stock/${ticker}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Stock not found");
          } else {
            setError("Failed to fetch stock data");
          }
          return;
        }
        const data = await res.json();
        setSnapshot(data.snapshot);
        setError(null);
      } catch (err) {
        console.error("Error fetching stock:", err);
        setError("Failed to fetch stock data");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [ticker]
  );

  // Initial fetch
  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  // Auto-refresh based on market hours
  useEffect(() => {
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
          fetchSnapshot(true);
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
          fetchSnapshot(true);
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
  }, [fetchSnapshot]);

  const handleExplain = async () => {
    if (!snapshot) return;

    if (explanation) {
      setExplanation(null);
      setExplanationMeta(null);
      return;
    }

    setLoadingExplanation(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: ticker,
          changePct: snapshot.changePct,
          price: snapshot.price,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json();
          setRateLimitError({ retryAfter: data.retryAfter || 60 });
          setTimeout(() => setRateLimitError(null), 5000);
        }
        return;
      }

      const data = await res.json();
      setExplanation(data.explanation);
      setExplanationMeta({
        age: data.age || null,
        refreshing: data.refreshing || false,
      });
    } finally {
      setLoadingExplanation(false);
    }
  };

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

    const marketOpen = isMarketOpen();

    return date.toLocaleTimeString("en-US", {
      month: isToday ? undefined : "short",
      day: isToday ? undefined : "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: includeSeconds && marketOpen ? "2-digit" : undefined,
    });
  };
  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatVolume = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatPrice = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading {ticker}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 -mt-20">
        <Card className="p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-foreground mb-2">{error}</h2>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find data for &quot;{ticker}&quot;. Please check
            the ticker symbol and try again.
          </p>
          <button
            onClick={() => router.push("/stock")}
            className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors"
          >
            Back to Search
          </button>
        </Card>
      </div>
    );
  }

  if (!snapshot) return null;

  const isPositive = snapshot.changePct >= 0;

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{ticker}</h1>
              {snapshot.extendedHoursSession && (
                <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400 font-medium">
                  {snapshot.extendedHoursSession === "premarket"
                    ? "Pre-market"
                    : "After-hours"}
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{companyName}</p>
          </div>
          {/* Add to Watchlist Button - Hide for indices */}
          {!isIndex && (
            <button
              onClick={() => setShowWatchlistModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-foreground transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add to Watchlist</span>
            </button>
          )}
        </div>

        {/* Add to Watchlist Modal */}
        <AddToWatchlistModal
          symbol={ticker}
          isOpen={showWatchlistModal}
          onClose={() => setShowWatchlistModal(false)}
        />

        {/* Rate Limit Warning */}
        {rateLimitError && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>
              Too many requests. Please wait {rateLimitError.retryAfter}s before
              trying again.
            </span>
          </div>
        )}

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Price & Chart (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Card */}
            <Card className="p-6">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl font-bold text-foreground">
                  {isIndex ? "" : "$"}
                  {formatPrice(snapshot.price)}
                </span>
                <span
                  className={`text-xl font-semibold ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {snapshot.changePct.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{formatTimestamp(snapshot.timestamp, true)}</span>
                {isIndex && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isMarketOpen()
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isPreMarket()
                        ? "bg-violet-500/20 text-violet-400"
                        : isAfterHours()
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isMarketOpen()
                      ? "Market Open"
                      : isPreMarket()
                      ? "Pre-Market"
                      : isAfterHours()
                      ? "After Hours"
                      : "Market Closed"}
                  </span>
                )}
              </div>

              {/* Extended Hours Info */}
              {snapshot.extendedHoursSession &&
                snapshot.extendedHoursPrice !== undefined && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-sm text-violet-400">
                        {snapshot.extendedHoursSession === "premarket"
                          ? "Pre-market"
                          : "After-hours"}
                        :
                      </span>
                      <span className="text-lg font-semibold text-foreground">
                        ${formatPrice(snapshot.extendedHoursPrice)}
                      </span>
                      {snapshot.extendedHoursChangePct !== undefined && (
                        <span
                          className={`text-sm font-medium ${
                            snapshot.extendedHoursChangePct >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {snapshot.extendedHoursChangePct >= 0 ? "+" : ""}
                          {snapshot.extendedHoursChangePct.toFixed(2)}%
                        </span>
                      )}
                      {snapshot.extendedHoursTimestamp && (
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(
                            snapshot.extendedHoursTimestamp,
                            false
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </Card>

            {/* Chart Card */}
            <Card className="p-6">
              <TickerChart
                symbol={ticker}
                currentPrice={snapshot.price}
                changePct={snapshot.changePct}
                previousClose={snapshot.previousClose}
              />
            </Card>

            {/* Explain Button & Panel - Hidden for indices */}
            {!isIndex && (
              <Card className="p-6">
                <button
                  onClick={handleExplain}
                  disabled={loadingExplanation}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-muted hover:bg-muted/80 rounded-lg text-foreground transition-colors font-medium disabled:opacity-50"
                >
                  {loadingExplanation ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : explanation ? (
                    <>
                      <span>Close</span>
                    </>
                  ) : (
                    <>
                      <span>Why is {ticker} moving?</span>
                    </>
                  )}
                </button>

                {explanation && (
                  <div className="mt-6 rounded-xl bg-muted/50 p-6 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-4 last:mb-0 text-foreground/90 leading-relaxed">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="space-y-3 list-none">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="pl-0">{children}</li>
                        ),
                      }}
                    >
                      {explanation}
                    </ReactMarkdown>
                    {explanationMeta?.age && (
                      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                        <span>{explanationMeta.age}</span>
                        {explanationMeta.refreshing && (
                          <span className="text-amber-400">
                            Refreshing in background...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Recent News - Hidden for indices */}
            {!isIndex && <StockNews ticker={ticker} />}
          </div>

          {/* Right Column - Sidebar Stats */}
          <div className="space-y-6">
            {/* Market Indices */}
            <MarketIndices variant="sidebar" />

            {/* Key Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Key Statistics
              </h3>
              <div className="space-y-4">
                {snapshot.marketCap !== undefined && snapshot.marketCap > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Cap</span>
                    <span className="font-medium text-foreground">
                      {formatLargeNumber(snapshot.marketCap)}
                    </span>
                  </div>
                )}
                {snapshot.volume !== undefined && snapshot.volume > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium text-foreground">
                      {formatVolume(snapshot.volume)}
                    </span>
                  </div>
                )}
                {snapshot.avgVolume !== undefined && snapshot.avgVolume > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Volume</span>
                    <span className="font-medium text-foreground">
                      {formatVolume(snapshot.avgVolume)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Price Range */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Price Range
              </h3>
              <div className="space-y-4">
                {snapshot.open !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Open</span>
                    <span className="font-medium text-foreground">
                      ${formatPrice(snapshot.open)}
                    </span>
                  </div>
                )}
                {snapshot.previousClose !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prev Close</span>
                    <span className="font-medium text-foreground">
                      ${formatPrice(snapshot.previousClose)}
                    </span>
                  </div>
                )}
                {snapshot.dayLow !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Day Low</span>
                    <span className="font-medium text-foreground">
                      ${formatPrice(snapshot.dayLow)}
                    </span>
                  </div>
                )}
                {snapshot.dayHigh !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Day High</span>
                    <span className="font-medium text-foreground">
                      ${formatPrice(snapshot.dayHigh)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* 52 Week Range */}
            {(snapshot.high52w !== undefined ||
              snapshot.low52w !== undefined) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  52 Week Range
                </h3>
                <div className="space-y-4">
                  {snapshot.low52w !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52W Low</span>
                      <span className="font-medium text-foreground">
                        ${formatPrice(snapshot.low52w)}
                      </span>
                    </div>
                  )}
                  {snapshot.high52w !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52W High</span>
                      <span className="font-medium text-foreground">
                        ${formatPrice(snapshot.high52w)}
                      </span>
                    </div>
                  )}
                  {/* 52 Week Range Bar */}
                  {snapshot.low52w !== undefined &&
                    snapshot.high52w !== undefined && (
                      <div className="mt-2">
                        <div className="h-2 bg-muted rounded-full">
                          <div
                            className="h-full bg-linear-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full relative"
                            style={{ width: "100%" }}
                          >
                            <div
                              className="absolute top-full -translate-y-1/4 w-4 h-4 bg-foreground rounded-full border-2 border-background shadow-lg"
                              style={{
                                left: `${
                                  ((snapshot.price - snapshot.low52w) /
                                    (snapshot.high52w - snapshot.low52w)) *
                                  100
                                }%`,
                                transform: "translate(-50%, -50%)",
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                          <span>${formatPrice(snapshot.low52w)}</span>
                          <span>${formatPrice(snapshot.high52w)}</span>
                        </div>
                      </div>
                    )}
                </div>
              </Card>
            )}

            {/* Extended Hours Quote */}
            {snapshot.extendedHoursSession &&
              (snapshot.extendedHoursBid !== undefined ||
                snapshot.extendedHoursAsk !== undefined) && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {snapshot.extendedHoursSession === "premarket"
                      ? "Pre-market"
                      : "After-hours"}{" "}
                    Quote
                  </h3>
                  <div className="space-y-4">
                    {snapshot.extendedHoursBid !== undefined &&
                      snapshot.extendedHoursBidSize !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bid</span>
                          <span className="font-medium text-emerald-400">
                            ${formatPrice(snapshot.extendedHoursBid)} x{" "}
                            {snapshot.extendedHoursBidSize.toLocaleString()}
                          </span>
                        </div>
                      )}
                    {snapshot.extendedHoursAsk !== undefined &&
                      snapshot.extendedHoursAskSize !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ask</span>
                          <span className="font-medium text-rose-400">
                            ${formatPrice(snapshot.extendedHoursAsk)} x{" "}
                            {snapshot.extendedHoursAskSize.toLocaleString()}
                          </span>
                        </div>
                      )}
                  </div>
                </Card>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
