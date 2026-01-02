import "server-only";
import { redis } from "@/lib/redis";
import { getTickerCacheTTL, isTradingActive } from "@/lib/marketHours";

export type ExplanationCacheEntry = {
  explanation: string;
  timestamp: number;
};

const DEFAULT_CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes during trading
const DEFAULT_CACHE_DURATION_SECONDS = 30 * 60; // 30 minutes during trading

function getDynamicCacheDuration(): { ms: number; seconds: number } {
  const ttlSeconds = getTickerCacheTTL(DEFAULT_CACHE_DURATION_SECONDS);
  return { ms: ttlSeconds * 1000, seconds: ttlSeconds };
}

// In-memory fallback for when Redis is unavailable
const explanationCache = new Map<string, ExplanationCacheEntry>();

/**
 * Get explanation from cache (Redis or in-memory fallback)
 * Returns the cached entry with timestamp for age calculation
 */
export async function getExplanationFromCache(
  symbol: string
): Promise<ExplanationCacheEntry | null> {
  const normalizedSymbol = symbol.toUpperCase();
  const cacheKey = `explain:${normalizedSymbol}`;

  // Try Redis first
  if (redis) {
    try {
      const cached = await redis.get<ExplanationCacheEntry>(cacheKey);
      if (cached) {
        console.log(`[Explain/Redis] Cache hit for ${normalizedSymbol}`);
        return cached;
      }
    } catch (error) {
      console.error(`[Explain/Redis] Error fetching from cache:`, error);
    }
  }

  const cached = explanationCache.get(normalizedSymbol);

  if (cached) {
    console.log(`[Explain/Memory] Cache hit for ${normalizedSymbol}`);
    return cached;
  }

  return null;
}

/**
 * Set explanation in cache with current timestamp
 */
export async function setExplanationInCache(
  symbol: string,
  explanation: string
): Promise<void> {
  const normalizedSymbol = symbol.toUpperCase();
  const cacheKey = `explain:${normalizedSymbol}`;
  const entry: ExplanationCacheEntry = {
    explanation,
    timestamp: Date.now(),
  };

  if (redis) {
    try {
      // Use dynamic TTL based on market hours
      // During trading: 2 hours for stale-while-revalidate
      // Outside trading: cache until next premarket (with 5 min cushion)
      const { seconds: baseTTL } = getDynamicCacheDuration();
      const redisTTL = isTradingActive()
        ? DEFAULT_CACHE_DURATION_SECONDS * 4
        : baseTTL;
      await redis.setex(cacheKey, redisTTL, entry);
      console.log(
        `[Explain/Redis] Stored new explanation for ${normalizedSymbol} (TTL: ${redisTTL}s)`
      );
      return;
    } catch (error) {
      console.error(`[Explain/Redis] Error setting cache:`, error);
    }
  }

  // Map.set() automatically replaces old value if key exists
  explanationCache.set(normalizedSymbol, entry);
  console.log(
    `[Explain/Memory] Stored new explanation for ${normalizedSymbol}. Cache size: ${explanationCache.size}`
  );
}

/**
 * Check if cached explanation is stale
 * During trading: stale after 30 minutes
 * Outside trading: never stale (handled in route via isTradingActive check)
 */
export function isCacheStale(entry: ExplanationCacheEntry): boolean {
  const now = Date.now();
  return now - entry.timestamp >= DEFAULT_CACHE_DURATION_MS;
}

/**
 * Get age of cached explanation in minutes
 */
export function getCacheAgeMinutes(entry: ExplanationCacheEntry): number {
  const now = Date.now();
  const ageMs = now - entry.timestamp;
  return Math.floor(ageMs / 60000);
}

/**
 * Format cache age for display
 * Examples: "Last updated just now", "Last updated 5 minutes ago", "Last updated 1 hour ago"
 */
export function formatCacheAge(entry: ExplanationCacheEntry): string {
  const minutes = getCacheAgeMinutes(entry);

  if (minutes < 1) {
    return "Last updated just now";
  } else if (minutes === 1) {
    return "Last updated 1 minute ago";
  } else if (minutes < 60) {
    return `Last updated ${minutes} minutes ago`;
  } else {
    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
      return "Last updated 1 hour ago";
    } else {
      return `Last updated ${hours} hours ago`;
    }
  }
}

/**
 * Clear all explanation caches (Redis and in-memory)
 */
export async function clearExplanationCache(): Promise<number> {
  let cleared = 0;

  // Clear Redis cache
  if (redis) {
    try {
      const keys = await redis.keys("explain:*");
      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
        cleared += keys.length;
        console.log(`[Explain/Redis] Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      console.error(`[Explain/Redis] Error clearing cache:`, error);
    }
  }

  // Clear in-memory cache
  const memorySize = explanationCache.size;
  explanationCache.clear();
  cleared += memorySize;
  console.log(`[Explain/Memory] Cleared ${memorySize} cache entries`);

  return cleared;
}

/**
 * Get cache statistics
 */
export async function getExplanationCacheStats() {
  const stats = {
    redis: { size: 0, keys: [] as string[] },
    memory: {
      size: explanationCache.size,
      keys: Array.from(explanationCache.keys()),
    },
  };

  if (redis) {
    try {
      const keys = await redis.keys("explain:*");
      stats.redis = {
        size: keys.length,
        keys: keys.map((k) => k.replace("explain:", "")),
      };
    } catch (error) {
      console.error(`[Explain/Redis] Error getting stats:`, error);
    }
  }

  console.log("[explainCache] Stats:", stats);
  return stats;
}

/**
 * Clean very old explanations from in-memory cache
 * (Redis handles expiration automatically with TTL)
 *
 * Note: We keep stale entries (30-60 min) to serve while refreshing.
 * Only delete entries older than 2 hours.
 */
export function cleanExpiredExplanations() {
  const now = Date.now();
  let cleaned = 0;
  const { ms: cacheDurationMs } = getDynamicCacheDuration();
  const MAX_AGE_MS = isTradingActive()
    ? DEFAULT_CACHE_DURATION_MS * 4
    : cacheDurationMs * 2;

  for (const [symbol, entry] of explanationCache.entries()) {
    if (now - entry.timestamp > MAX_AGE_MS) {
      explanationCache.delete(symbol);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Explain/Memory] Cleaned ${cleaned} expired entries`);
  }
}
