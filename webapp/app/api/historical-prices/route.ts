import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type TimeRange = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y";

// Cache TTLs based on bar frequency
const CACHE_TTL: Record<TimeRange, number> = {
  "1D": 60,
  "5D": 900,
  "1M": 3600,
  "3M": 3600,
  "6M": 86400,
  YTD: 86400,
  "1Y": 86400,
  "5Y": 86400,
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
        const oneDayFrom = getFromDate(3);
        url = `https://financialmodelingprep.com/stable/historical-chart/1min?symbol=${symbol}&from=${oneDayFrom}&to=${oneDayFrom}&apikey=${apiKey}`;
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
        const ytdFrom = `${now.getFullYear()}-01-01`;
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

    const res = await fetch(url, {
      next: { revalidate: range === "1D" || range === "5D" ? 60 : 300 },
    });

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

    // Cache the result in Redis
    if (redis && prices.length > 0) {
      try {
        await redis.set(cacheKey, response, { ex: CACHE_TTL[range] });
        console.log(`[Cache] SET: ${cacheKey} (TTL: ${CACHE_TTL[range]}s)`);
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
