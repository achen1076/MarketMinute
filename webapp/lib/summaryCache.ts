import "server-only";

type MarketMinuteSummary = {
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
};

type SummaryCacheEntry = {
  summary: MarketMinuteSummary;
  timestamp: number;
};

const summaryCache = new Map<string, SummaryCacheEntry>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function getSummaryFromCache(
  listName: string,
  symbolsKey: string
): MarketMinuteSummary | null {
  const cacheKey = `${listName}:${symbolsKey}`;
  const cached = summaryCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
    console.log(`[Summary] Cache hit for ${listName}`);
    return cached.summary;
  }

  return null;
}

export function setSummaryInCache(
  listName: string,
  symbolsKey: string,
  summary: MarketMinuteSummary
) {
  const cacheKey = `${listName}:${symbolsKey}`;
  summaryCache.set(cacheKey, {
    summary,
    timestamp: Date.now(),
  });
  console.log(`[Summary] Cached new summary for ${listName}. Cache size now: ${summaryCache.size}`);
}

export function clearSummaryCache(): number {
  const size = summaryCache.size;
  summaryCache.clear();
  console.log(`[Summary] Cleared ${size} cache entries`);
  return size;
}

export function getSummaryCacheStats() {
  console.log("[summaryCache] Getting stats, cache size:", summaryCache.size);
  console.log("[summaryCache] Cache keys:", Array.from(summaryCache.keys()));
  return {
    size: summaryCache.size,
    keys: Array.from(summaryCache.keys()),
  };
}

export function cleanExpiredSummaries() {
  const now = Date.now();
  for (const [key, entry] of summaryCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION_MS) {
      summaryCache.delete(key);
    }
  }
}
