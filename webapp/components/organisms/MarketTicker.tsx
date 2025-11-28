"use client";

import { useState, useEffect, useRef } from "react";
import { CACHE_TTL_MS } from "@/lib/constants";

type TickerItem = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

const TICKER_SYMBOLS = [
  { symbol: "$SPX", name: "S&P 500" },
  { symbol: "$DJI", name: "Dow" },
  { symbol: "$COMPX", name: "Nasdaq" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
];

export function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTickers = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/market-ticker");
      if (res.ok) {
        const data = await res.json();
        setTickers(data.tickers || []);
      }
    } catch (error) {
      console.error("Failed to fetch market tickers:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickers();
    // Poll at cache TTL interval
    const interval = setInterval(fetchTickers, CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || tickers.length === 0) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5;
    let animationFrameId: number;

    const animate = () => {
      scrollPosition += scrollSpeed;

      const singleSetWidth = scrollContainer.scrollWidth / 2;

      if (scrollPosition >= singleSetWidth) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [tickers.length]);

  return (
    <div
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "#050B1B",
        borderColor: "#111827",
      }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="flex items-center gap-6 overflow-x-auto scrollbar-hide whitespace-nowrap"
          >
            {tickers.length === 0 ? (
              <div className="text-slate-400 text-sm">
                Loading market data...
              </div>
            ) : (
              <>
                {/* Original ticker items */}
                {tickers.map((ticker, idx) => (
                  <div
                    key={`${ticker.symbol}-${idx}`}
                    className="flex items-center gap-2 text-sm shrink-0"
                  >
                    <span className="font-semibold text-slate-200">
                      {ticker.name}
                    </span>
                    <span className="text-slate-300">
                      {ticker.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`font-semibold ${
                        ticker.changePct > 0
                          ? "text-emerald-400"
                          : ticker.changePct < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {ticker.changePct > 0 ? "+" : ""}
                      {ticker.changePct.toFixed(2)}%
                    </span>
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {tickers.map((ticker, idx) => (
                  <div
                    key={`${ticker.symbol}-dup-${idx}`}
                    className="flex items-center gap-2 text-sm shrink-0"
                  >
                    <span className="font-semibold text-slate-200">
                      {ticker.name}
                    </span>
                    <span className="text-slate-300">
                      {ticker.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`font-semibold ${
                        ticker.changePct > 0
                          ? "text-emerald-400"
                          : ticker.changePct < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {ticker.changePct > 0 ? "+" : ""}
                      {ticker.changePct.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
