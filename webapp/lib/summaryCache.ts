import "server-only";
import { redis } from "@/lib/redis";
import {
  getLastMarketOpenTime,
  getSummaryCacheTTL,
  isMainTradingWindow,
} from "@/lib/marketHours";

type MintalyzeSummary = {
  headline: string;
  body: string;
  stats: {
    listName: string;
    totalSymbols: number;
    upCount: number;
    downCount: number;
    best: { symbol: string; changePct: number } | null;
    worst: { symbol: string; changePct: number } | null;
  };
  tickerPerformance: Array<{ symbol: string; changePct: number }>;
  generatedAt: string;
};

type SummaryCacheEntry = {
  summary: MintalyzeSummary;
  timestamp: number;
};

const summaryCache = new Map<string, SummaryCacheEntry>();

function getCacheDuration(): { ms: number; seconds: number } {
  const seconds = getSummaryCacheTTL();
  return { ms: seconds * 1000, seconds };
}

function isCacheFromCurrentSession(timestamp: number): boolean {
  const lastMarketOpen = getLastMarketOpenTime();

  // If cache was created before the last market open, it's stale
  // This ensures we get fresh data at the start of each trading day
  if (timestamp < lastMarketOpen.getTime()) {
    return false;
  }

  return true;
}

export async function getSummaryFromCache(
  listName: string,
  symbolsKey: string
): Promise<MintalyzeSummary | null> {
  const cacheKey = `summary:${listName}:${symbolsKey}`;
  const now = Date.now();

  const { ms: cacheDurationMs } = getCacheDuration();

  // Try Redis first
  if (redis) {
    try {
      const cached = await redis.get<SummaryCacheEntry>(cacheKey);
      if (cached && now - cached.timestamp < cacheDurationMs) {
        // During main trading window, check if cache is from current session
        if (
          isMainTradingWindow() &&
          !isCacheFromCurrentSession(cached.timestamp)
        ) {
          console.log(
            `[Summary/Redis] Cache stale (from previous session) for ${listName}`
          );
          return null;
        }
        console.log(`[Summary/Redis] Cache hit for ${listName}`);
        return cached.summary;
      }
    } catch (error) {
      console.error(`[Summary/Redis] Error fetching from cache:`, error);
    }
  }

  // Fallback to in-memory
  const cached = summaryCache.get(cacheKey);
  if (cached && now - cached.timestamp < cacheDurationMs) {
    // During main trading window, check if cache is from current session
    if (isMainTradingWindow() && !isCacheFromCurrentSession(cached.timestamp)) {
      console.log(
        `[Summary/Memory] Cache stale (from previous session) for ${listName}`
      );
      return null;
    }
    console.log(`[Summary/Memory] Cache hit for ${listName}`);
    return cached.summary;
  }

  return null;
}

export async function setSummaryInCache(
  listName: string,
  symbolsKey: string,
  summary: MintalyzeSummary
): Promise<void> {
  const cacheKey = `summary:${listName}:${symbolsKey}`;
  const entry: SummaryCacheEntry = {
    summary,
    timestamp: Date.now(),
  };

  const { seconds: cacheDurationSeconds } = getCacheDuration();

  // Try Redis first
  if (redis) {
    try {
      await redis.setex(cacheKey, cacheDurationSeconds, entry);
      console.log(
        `[Summary/Redis] Cached summary for ${listName} (TTL: ${cacheDurationSeconds}s)`
      );
      return;
    } catch (error) {
      console.error(`[Summary/Redis] Error setting cache:`, error);
    }
  }

  // Fallback to in-memory
  summaryCache.set(cacheKey, entry);
  console.log(
    `[Summary/Memory] Cached summary for ${listName}. Size: ${summaryCache.size}`
  );
}

export async function clearSummaryCache(): Promise<number> {
  let cleared = 0;

  // Clear Redis cache
  if (redis) {
    try {
      const keys = await redis.keys("summary:*");
      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
        cleared += keys.length;
        console.log(`[Summary/Redis] Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      console.error(`[Summary/Redis] Error clearing cache:`, error);
    }
  }

  const memorySize = summaryCache.size;
  summaryCache.clear();
  cleared += memorySize;
  console.log(`[Summary/Memory] Cleared ${memorySize} cache entries`);

  return cleared;
}

export async function getSummaryCacheStats() {
  const stats = {
    redis: { size: 0, keys: [] as string[] },
    memory: {
      size: summaryCache.size,
      keys: Array.from(summaryCache.keys()),
    },
  };

  if (redis) {
    try {
      const keys = await redis.keys("summary:*");
      stats.redis = {
        size: keys.length,
        keys: keys.map((k) => k.replace("summary:", "")),
      };
    } catch (error) {
      console.error(`[Summary/Redis] Error getting stats:`, error);
    }
  }

  console.log("[summaryCache] Stats:", stats);
  return stats;
}

export function cleanExpiredSummaries() {
  const now = Date.now();
  const { ms: cacheDurationMs } = getCacheDuration();
  const MAX_AGE_MS = cacheDurationMs * 2;

  for (const [key, entry] of summaryCache.entries()) {
    if (now - entry.timestamp > MAX_AGE_MS) {
      summaryCache.delete(key);
    }
  }
}
