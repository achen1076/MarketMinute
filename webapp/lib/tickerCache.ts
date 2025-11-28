/**
 * Unified Ticker Cache
 *
 * Caches individual ticker snapshots to prevent redundant FMP API calls.
 * Uses Redis for app-level shared cache when available, falls back to in-memory.
 *
 * Example:
 * - User A views market ticker (fetches AAPL, MSFT, etc.)
 * - User B views watchlist with AAPL → Uses cached AAPL data from Redis
 * - Result: 1 FMP API call instead of 2, shared across all instances
 */

import { getSnapshotsForSymbols, TickerSnapshot } from "@/lib/marketData";
import { redis } from "@/lib/redis";

const CACHE_TTL_SECONDS = 5; // 5 seconds for Redis TTL
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000; // 5 seconds for in-memory cache

// In-memory fallback cache (used when Redis is not available)
const tickerCache = new Map<
  string,
  { snapshot: TickerSnapshot; timestamp: number }
>();

// Cleanup expired entries every minute (only for in-memory cache)
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
 * - Uses Redis cache when available (5 second TTL)
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
    for (const symbol of symbols) {
      try {
        const cacheKey = `ticker:${symbol}`;
        const cachedData = await redis.get<TickerSnapshot>(cacheKey);

        if (cachedData) {
          cached.push(cachedData);
        } else {
          toFetch.push(symbol);
        }
      } catch (error) {
        console.error(`[Redis] Error fetching ${symbol}:`, error);
        toFetch.push(symbol);
      }
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

    if (redis) {
      for (const snapshot of fresh) {
        try {
          const cacheKey = `ticker:${snapshot.symbol}`;
          await redis.setex(cacheKey, CACHE_TTL_SECONDS, snapshot);
        } catch (error) {
          console.error(`[Redis] Error caching ${snapshot.symbol}:`, error);
        }
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
