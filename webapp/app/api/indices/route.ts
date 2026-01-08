import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redis } from "@/lib/redis";
import { CACHE_TTL_SECONDS, CACHE_TTL_MS } from "@/lib/constants";
import { getTickerCacheTTL } from "@/lib/marketHours";

const INDICES = ["^GSPC", "^DJI", "^IXIC"];

type IndexQuote = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  change: number;
  dayHigh?: number;
  dayLow?: number;
  previousClose?: number;
  timestamp?: number;
};

// In-memory cache fallback
const indexCache = new Map<string, { data: IndexQuote; timestamp: number }>();

// Clean up stale entries periodically (only if no Redis)
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    for (const [symbol, entry] of indexCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        indexCache.delete(symbol);
      }
    }
  }, 60000);
}

async function fetchIndexFromAPI(
  symbol: string,
  apiKey: string
): Promise<IndexQuote | null> {
  try {
    const url = new URL("https://financialmodelingprep.com/stable/quote");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      console.error(`[Indices API] Failed to fetch ${symbol}: ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const quote = data[0];
      return {
        symbol: quote.symbol,
        name: quote.name,
        price: Number(quote.price) || 0,
        changePct: Number(quote.changePercentage) || 0,
        change: Number(quote.change) || 0,
        dayHigh: quote.dayHigh ? Number(quote.dayHigh) : undefined,
        dayLow: quote.dayLow ? Number(quote.dayLow) : undefined,
        previousClose: quote.previousClose
          ? Number(quote.previousClose)
          : undefined,
        timestamp: quote.timestamp ? Number(quote.timestamp) : undefined,
      };
    }
    return null;
  } catch (error) {
    console.error(`[Indices API] Error fetching ${symbol}:`, error);
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[Indices API] FMP_API_KEY not configured");
    return NextResponse.json({ indices: [] });
  }

  try {
    const cached: IndexQuote[] = [];
    const toFetch: string[] = [];

    // Check cache first
    if (redis) {
      try {
        const cacheKeys = INDICES.map((s) => `index:${s}`);
        const cachedResults = await redis.mget<IndexQuote[]>(...cacheKeys);

        for (let i = 0; i < INDICES.length; i++) {
          const cachedData = cachedResults[i];
          if (cachedData) {
            cached.push(cachedData);
          } else {
            toFetch.push(INDICES[i]);
          }
        }
      } catch (error) {
        console.error(`[Indices API] Redis fetch error:`, error);
        toFetch.push(...INDICES);
      }
    } else {
      // Use in-memory cache
      const now = Date.now();
      for (const symbol of INDICES) {
        const entry = indexCache.get(symbol);
        if (entry && now - entry.timestamp < CACHE_TTL_MS) {
          cached.push(entry.data);
        } else {
          toFetch.push(symbol);
        }
      }
    }

    // Fetch uncached indices from API
    let fresh: IndexQuote[] = [];
    if (toFetch.length > 0) {
      const results = await Promise.all(
        toFetch.map((symbol) => fetchIndexFromAPI(symbol, apiKey))
      );
      fresh = results.filter((r): r is IndexQuote => r !== null);

      // Cache the fresh data
      const cacheTTL = getTickerCacheTTL(CACHE_TTL_SECONDS);

      if (redis && fresh.length > 0) {
        try {
          const pipeline = redis.pipeline();
          for (const quote of fresh) {
            const cacheKey = `index:${quote.symbol}`;
            pipeline.setex(cacheKey, cacheTTL, quote);
          }
          await pipeline.exec();
        } catch (error) {
          console.error(`[Indices API] Redis write error:`, error);
        }
      } else {
        const now = Date.now();
        for (const quote of fresh) {
          indexCache.set(quote.symbol, {
            data: quote,
            timestamp: now,
          });
        }
      }
    }

    const cacheType = redis ? "Redis" : "Memory";
    console.log(
      `[Indices/${cacheType}] Hits: ${cached.length} | Misses: ${toFetch.length}`
    );

    const indices = [...cached, ...fresh];

    return NextResponse.json({ indices });
  } catch (error) {
    console.error("[Indices API] Error:", error);
    return NextResponse.json({ indices: [] }, { status: 500 });
  }
}
