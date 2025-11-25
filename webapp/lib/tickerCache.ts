/**
 * Unified Ticker Cache
 *
 * Caches individual ticker snapshots to prevent redundant Schwab API calls.
 * Shared across market-ticker and watchlist endpoints.
 *
 * Example:
 * - User A views market ticker (fetches AAPL, MSFT, etc.)
 * - User B views watchlist with AAPL → Uses cached AAPL data
 * - Result: 1 Schwab API call instead of 2
 */

import { getSnapshotsForSymbols, TickerSnapshot } from "@/lib/marketData";

const CACHE_TTL = 5000;
const tickerCache = new Map<
  string,
  { snapshot: TickerSnapshot; timestamp: number }
>();

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [symbol, entry] of tickerCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      tickerCache.delete(symbol);
    }
  }
}, 60000);

/**
 * Get snapshots for symbols with intelligent caching
 *
 * - Uses cached data for fresh tickers
 * - Only fetches uncached/stale tickers from Schwab API
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
  const now = Date.now();
  const cached: TickerSnapshot[] = [];
  const toFetch: string[] = [];

  // Check cache for each symbol
  for (const symbol of symbols) {
    const entry = tickerCache.get(symbol);
    if (entry && now - entry.timestamp < CACHE_TTL) {
      cached.push(entry.snapshot);
    } else {
      toFetch.push(symbol);
    }
  }

  // Fetch uncached symbols from Schwab API
  let fresh: TickerSnapshot[] = [];
  if (toFetch.length > 0) {
    fresh = await getSnapshotsForSymbols(toFetch);

    // Update cache with fresh data
    for (const snapshot of fresh) {
      tickerCache.set(snapshot.symbol, {
        snapshot,
        timestamp: now,
      });
    }
  }

  // Log cache performance for debugging
  if (symbols.length > 0) {
    console.log(
      `[TickerCache] Requested: ${symbols.length} | Hits: ${cached.length} | Misses: ${toFetch.length} | Cache size: ${tickerCache.size}`
    );
    if (toFetch.length > 0) {
      console.log(
        `[TickerCache] Fetching from Schwab API: ${toFetch.join(", ")}`
      );
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
