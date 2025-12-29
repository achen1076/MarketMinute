"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CACHE_TTL_MS } from "@/lib/constants";
import { isMarketOpen } from "@/lib/marketHours";

type TickerItem = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

export function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const fetchTickers = useCallback(async () => {
    try {
      const res = await fetch("/api/market-ticker");
      if (res.ok) {
        const data = await res.json();
        if (data.tickers?.length > 0) {
          setTickers(data.tickers);
        }
      }
    } catch (error) {
      console.error("Failed to fetch market tickers:", error);
    }
  }, []);

  useEffect(() => {
    fetchTickers();
    if (!isMarketOpen()) {
      return;
    }

    const interval = setInterval(() => {
      if (isMarketOpen()) {
        fetchTickers();
      }
    }, CACHE_TTL_MS);

    return () => clearInterval(interval);
  }, [fetchTickers]);

  // Start animation once when tickers are first loaded
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || tickers.length === 0 || isAnimatingRef.current)
      return;

    isAnimatingRef.current = true;
    const vwPerSecond = 7.5;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const pixelsPerSecond = (window.innerWidth * vwPerSecond) / 100;
      const singleSetWidth = scrollContainer.scrollWidth / 2;

      scrollPositionRef.current += pixelsPerSecond * deltaTime;

      if (scrollPositionRef.current >= singleSetWidth) {
        scrollPositionRef.current = 0;
      }

      scrollContainer.scrollLeft = scrollPositionRef.current;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      scrollPositionRef.current = 0;
      if (scrollContainer) {
        scrollContainer.scrollLeft = 0;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
      isAnimatingRef.current = false;
    };
  }, [tickers.length > 0]); // Only run when tickers become available

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b"
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
