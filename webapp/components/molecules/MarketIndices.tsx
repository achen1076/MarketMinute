"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/atoms/Card";
import { CACHE_TTL_MS } from "@shared/lib/constants";
import { isMarketOpen, isAfterHours, isPreMarket } from "@shared/lib/marketHours";
import { TrendingUp, TrendingDown } from "lucide-react";

type IndexSnapshot = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  timestamp?: number;
};

// Format timestamp
const formatTime = (timestamp?: number) => {
  if (!timestamp) return null;
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

type MarketIndicesProps = {
  variant?: "sidebar" | "horizontal";
  className?: string;
};

export function MarketIndices({
  variant = "sidebar",
  className = "",
}: MarketIndicesProps) {
  const router = useRouter();
  const [indices, setIndices] = useState<IndexSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIndices = useCallback(async () => {
    try {
      const res = await fetch("/api/indices");
      if (res.ok) {
        const data = await res.json();
        setIndices(data.indices || []);
      }
    } catch (error) {
      console.error("Failed to fetch indices:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  // Auto-refresh based on market hours
  useEffect(() => {
    const shouldRefresh = isMarketOpen() || isAfterHours() || isPreMarket();
    if (!shouldRefresh) return;

    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (
          document.visibilityState === "visible" &&
          (isMarketOpen() || isAfterHours() || isPreMarket())
        ) {
          fetchIndices();
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
          fetchIndices();
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
  }, [fetchIndices]);

  // Map index symbols to friendly URLs
  const getIndexUrl = (symbol: string) => {
    switch (symbol) {
      case "^GSPC":
        return "/stock/sp500";
      case "^DJI":
        return "/stock/dow";
      case "^IXIC":
        return "/stock/nasdaq";
      default:
        return `/stock/${symbol}`;
    }
  };

  const handleSelect = (symbol: string) => {
    router.push(getIndexUrl(symbol));
  };

  if (variant === "sidebar") {
    // Get market status
    const marketOpen = isMarketOpen();
    const preMarket = isPreMarket();
    const afterHrs = isAfterHours();
    const marketStatus = marketOpen
      ? "Market Open"
      : preMarket
      ? "Pre-Market"
      : afterHrs
      ? "After Hours"
      : "Market Closed";
    const marketStatusClass = marketOpen
      ? "text-emerald-400"
      : preMarket || afterHrs
      ? "text-violet-400"
      : "text-muted-foreground";

    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Major Market Index
          </h3>
          <span className={`text-xs font-medium ${marketStatusClass}`}>
            {marketStatus}
          </span>
        </div>
        <div className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-4 bg-muted rounded w-12" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            indices.map((index) => {
              const isPositive = index.changePct >= 0;
              return (
                <button
                  key={index.symbol}
                  onClick={() => handleSelect(index.symbol)}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {index.name}
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-rose-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {index.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {index.changePct.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>
    );
  }

  // Horizontal variant (default) - responsive grid
  const marketOpen = isMarketOpen();
  const preMarket = isPreMarket();
  const afterHrs = isAfterHours();
  const marketStatus = marketOpen
    ? "Market Open"
    : preMarket
    ? "Pre-Market"
    : afterHrs
    ? "After Hours"
    : "Market Closed";
  const marketStatusClass = marketOpen
    ? "text-emerald-400"
    : preMarket || afterHrs
    ? "text-violet-400"
    : "text-muted-foreground";

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Major Indices
        </h3>
        <span className={`text-xs font-medium ${marketStatusClass}`}>
          {marketStatus}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-5 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-12" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          indices.map((index) => {
            const isPositive = index.changePct >= 0;
            return (
              <Card
                key={index.symbol}
                className="p-4 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all group"
              >
                <button
                  onClick={() => handleSelect(index.symbol)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {index.name}
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {index.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {index.changePct.toFixed(2)}%
                  </div>
                </button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
