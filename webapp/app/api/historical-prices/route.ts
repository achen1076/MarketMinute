import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getChartCacheTTL } from "@/lib/marketHours";

type TimeRange = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y";

// Cache TTLs based on bar frequency
const CACHE_TTL: Record<TimeRange, number> = {
  "1D": 60,
  "5D": 900,
  "1M": 3600,
  "3M": 3600,
  "6M": 604800,
  YTD: 604800,
  "1Y": 604800,
  "5Y": 604800,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const range = (searchParams.get("range") || "1M") as TimeRange;

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  // Check Redis cache first
  const cacheKey = `historical:${symbol.toUpperCase()}:${range}`;
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[Cache] HIT: ${cacheKey}`);
        return NextResponse.json(cached);
      }
      console.log(`[Cache] MISS: ${cacheKey}`);
    } catch (err) {
      console.error("[Cache] Redis error:", err);
    }
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    let url: string;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const getFromDate = (daysBack: number) => {
      const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      return date.toISOString().split("T")[0];
    };

    switch (range) {
      case "1D":
        url = `https://financialmodelingprep.com/stable/historical-chart/1min?symbol=${symbol}&apikey=${apiKey}`;
        break;
      case "5D":
        const fiveDayFrom = getFromDate(7);
        url = `https://financialmodelingprep.com/stable/historical-chart/15min?symbol=${symbol}&from=${fiveDayFrom}&to=${today}&apikey=${apiKey}`;
        break;
      case "1M":
        const oneMonthFrom = getFromDate(30);
        url = `https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=${symbol}&from=${oneMonthFrom}&to=${today}&apikey=${apiKey}`;
        break;
      case "3M":
        const threeMonthFrom = getFromDate(90);
        url = `https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=${symbol}&from=${threeMonthFrom}&to=${today}&apikey=${apiKey}`;
        break;
      case "6M":
        const sixMonthFrom = getFromDate(180);
        url = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${symbol}&from=${sixMonthFrom}&to=${today}&apikey=${apiKey}`;
        break;
      case "YTD":
        const ytdFrom =
          now.getDate() === 1
            ? `${now.getFullYear() - 1}-01-01`
            : `${now.getFullYear()}-01-01`;
        url = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${symbol}&from=${ytdFrom}&to=${today}&apikey=${apiKey}`;
        break;
      case "1Y":
        const oneYearFrom = getFromDate(365);
        url = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${symbol}&from=${oneYearFrom}&to=${today}&apikey=${apiKey}`;
        break;
      case "5Y":
        const fiveYearFrom = getFromDate(5 * 365);
        url = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${symbol}&from=${fiveYearFrom}&to=${today}&apikey=${apiKey}`;
        break;
      default:
        url = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${symbol}&apikey=${apiKey}`;
        break;
    }

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`[FMP] Historical data error: ${res.status}`);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: res.status }
      );
    }

    const data = await res.json();

    let prices: Array<{ date: string; close: number }> = [];

    if (range === "6M" || range === "YTD" || range === "1Y" || range === "5Y") {
      if (Array.isArray(data)) {
        prices = data
          .map((item: any) => ({
            date: item.date,
            close: item.price,
          }))
          .reverse();
      }
    } else {
      if (Array.isArray(data)) {
        prices = data
          .map((item: any) => ({
            date: item.date,
            close: item.close,
          }))
          .reverse();
      }
    }

    if (range === "1D" && prices.length > 0) {
      const mostRecentDate = prices[prices.length - 1].date.split(" ")[0];
      prices = prices.filter((p) => p.date.startsWith(mostRecentDate));
    }

    const response = {
      symbol,
      range,
      prices,
    };

    // Cache the result in Redis with dynamic TTL
    if (redis && prices.length > 0) {
      try {
        const dynamicTTL = getChartCacheTTL(CACHE_TTL[range]);
        await redis.set(cacheKey, response, { ex: dynamicTTL });
        console.log(`[Cache] SET: ${cacheKey} (TTL: ${dynamicTTL}s)`);
      } catch (err) {
        console.error("[Cache] Redis set error:", err);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[FMP] Historical prices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
