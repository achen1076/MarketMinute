"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  isMarketOpen,
  isPreMarket,
  isAfterHours,
  isOvernightPeriod,
} from "@/lib/marketHours";

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

    // Set up dynamic polling based on market hours
    const pollInterval = getPollingInterval();
    const interval = setInterval(() => {
      fetchTickers();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [fetchTickers]);

  // Calculate how many times to duplicate tickers to fill the screen
  const getRepeatCount = () => {
    // Estimate: each ticker takes roughly 150px, we want enough to fill 2x screen width
    const estimatedTickerWidth = 150;
    const screenWidth =
      typeof window !== "undefined" ? window.innerWidth : 1920;
    const tickersNeeded = Math.ceil(
      (screenWidth * 2) / (tickers.length * estimatedTickerWidth)
    );
    return Math.max(2, tickersNeeded); 
  };

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
      // Single set is half the total content (we duplicate for seamless loop)
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

  const repeatCount = getRepeatCount();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b bg-card border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="flex items-center gap-6 overflow-x-auto scrollbar-hide whitespace-nowrap"
          >
            {tickers.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Loading market data...
              </div>
            ) : (
              <>
                {/* First set */}
                {Array.from({ length: repeatCount }).map((_, setIdx) =>
                  tickers.map((ticker, idx) =>
                    renderTickerItem(ticker, idx, `-set${setIdx}`)
                  )
                )}
                {/* Duplicate set for seamless loop */}
                {Array.from({ length: repeatCount }).map((_, setIdx) =>
                  tickers.map((ticker, idx) =>
                    renderTickerItem(ticker, idx, `-dup${setIdx}`)
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
