"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isMarketOpen,
  isPreMarket,
  isAfterHours,
  isOvernightPeriod,
} from "@shared/lib/marketHours";
import useWindowSize from "@/hooks/useWindowSize";

type TickerItem = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

function getPollingInterval(): number {
  if (isMarketOpen()) {
    return 5000;
  }
  if (isPreMarket() || isAfterHours()) {
    return 60000;
  }
  if (isOvernightPeriod()) {
    return 300000;
  }
  return 300000;
}

export function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { isMobile } = useWindowSize();

  const fetchTickers = useCallback(async () => {
    try {
      const res = await fetch("/api/market-ticker");
      if (res.ok) {
        const data = await res.json();
        if (data.tickers?.length > 0) {
          setTickers(data.tickers);
          if (!isLoaded) {
            setTimeout(() => setIsLoaded(true), 100);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch market tickers:", error);
    }
  }, [isLoaded]);

  useEffect(() => {
    fetchTickers();

    const pollInterval = getPollingInterval();
    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchTickers();
        }
      }, pollInterval);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchTickers();
        startPolling();
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
  }, [fetchTickers]);

  const animationDuration = isMobile ? 30 : 20;

  const renderTickerItem = (
    ticker: TickerItem,
    idx: number,
    suffix: string = ""
  ) => (
    <div
      key={`${ticker.symbol}${suffix}-${idx}`}
      className="flex items-center gap-2 text-sm shrink-0"
    >
      <span className="font-semibold text-foreground">{ticker.name}</span>
      <span className="text-foreground/80">
        {ticker.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
      <span
        className={`font-semibold ${
          ticker.changePct > 0
            ? "text-emerald-500 dark:text-emerald-400"
            : ticker.changePct < 0
            ? "text-red-500 dark:text-rose-400"
            : "text-muted-foreground"
        }`}
      >
        {ticker.changePct > 0 ? "+" : ""}
        {ticker.changePct.toFixed(2)}%
      </span>
    </div>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b bg-card border-border overflow-hidden">
      <div className="flex items-center px-4 py-2">
        <div
          className={`flex items-center gap-6 whitespace-nowrap transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            animation:
              tickers.length > 0
                ? `ticker-scroll ${animationDuration}s linear infinite`
                : "none",
          }}
        >
          {tickers.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              Loading market data...
            </div>
          ) : (
            <>
              {/* First set */}
              {tickers.map((ticker, idx) =>
                renderTickerItem(ticker, idx, "-a")
              )}
              {/* Duplicate for seamless loop */}
              {tickers.map((ticker, idx) =>
                renderTickerItem(ticker, idx, "-b")
              )}
            </>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
