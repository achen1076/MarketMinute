/**
 * Unified Ticker Cache
 *
 * Caches individual ticker snapshots to prevent redundant FMP API calls.
 * Uses Redis for app-level shared cache when available, falls back to in-memory.
 * Implements batch operations to minimize Redis round-trips:
 * - Batch reads: 1 mget call instead of N get calls
 * - Batch writes: 1 pipeline instead of N setex calls
 *
 * Example:
 * - User A views market ticker (fetches AAPL, MSFT, etc.)
 * - User B views watchlist with AAPL → Uses cached AAPL data from Redis
 * - Result: 1 FMP API call + 1 Redis mget instead of 2 FMP + N Redis gets
 */

import { getSnapshotsForSymbols, TickerSnapshot } from "@/lib/marketData";
import { redis } from "@/lib/redis";
import { CACHE_TTL_SECONDS, CACHE_TTL_MS } from "@/lib/constants";
import { isMarketOpen } from "@/lib/marketHours";

const tickerCache = new Map<
  string,
  { snapshot: TickerSnapshot; timestamp: number }
>();

if (!redis) {
  setInterval(() => {
    const now = Date.now();
    for (const [symbol, entry] of tickerCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        tickerCache.delete(symbol);
      }
    }
  }, 60000);
}

/**
 * Get snapshots for symbols with intelligent caching
 *
 * - Uses Redis cache when available (15 second TTL)
 * - Falls back to in-memory cache
 * - Only fetches uncached/stale tickers from FMP API
 * - Returns combined cached + fresh data
 */
export async function getCachedSnapshots(symbols: string[]): Promise<{
  snapshots: TickerSnapshot[];
  cacheStats: {
    hits: number;
    misses: number;
    total: number;
  };
}> {
  const cached: TickerSnapshot[] = [];
  const toFetch: string[] = [];

  if (redis) {
    try {
      const cacheKeys = symbols.map((s) => `ticker:${s}`);
      const cachedResults = await redis.mget<TickerSnapshot[]>(...cacheKeys);

      for (let i = 0; i < symbols.length; i++) {
        const cachedData = cachedResults[i];
        if (cachedData) {
          cached.push(cachedData);
        } else {
          toFetch.push(symbols[i]);
        }
      }
    } catch (error) {
      console.error(`[Redis] Batch fetch error:`, error);
      toFetch.push(...symbols);
    }
  } else {
    const now = Date.now();
    for (const symbol of symbols) {
      const entry = tickerCache.get(symbol);
      if (entry && now - entry.timestamp < CACHE_TTL_MS) {
        cached.push(entry.snapshot);
      } else {
        toFetch.push(symbol);
      }
    }
  }

  // Fetch uncached symbols from FMP API
  let fresh: TickerSnapshot[] = [];
  if (toFetch.length > 0) {
    fresh = await getSnapshotsForSymbols(toFetch);

    const cacheTTL = CACHE_TTL_SECONDS;

    if (redis && fresh.length > 0) {
      try {
        const pipeline = redis.pipeline();
        for (const snapshot of fresh) {
          const cacheKey = `ticker:${snapshot.symbol}`;
          pipeline.setex(cacheKey, cacheTTL, snapshot);
        }
        await pipeline.exec();
      } catch (error) {
        console.error(`[Redis] Batch write error:`, error);
      }
    } else {
      const now = Date.now();
      for (const snapshot of fresh) {
        tickerCache.set(snapshot.symbol, {
          snapshot,
          timestamp: now,
        });
      }
    }
  }

  if (symbols.length > 0) {
    const cacheType = redis ? "Redis" : "Memory";
    console.log(
      `[TickerCache/${cacheType}] Requested: ${symbols.length} | Hits: ${cached.length} | Misses: ${toFetch.length}`
    );
    if (toFetch.length > 0) {
      console.log(`[TickerCache] Fetching from FMP API: ${toFetch.join(", ")}`);
    }
  }

  return {
    snapshots: [...cached, ...fresh],
    cacheStats: {
      hits: cached.length,
      misses: toFetch.length,
      total: symbols.length,
    },
  };
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return {
    size: tickerCache.size,
    tickers: Array.from(tickerCache.keys()),
  };
}
