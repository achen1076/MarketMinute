import "server-only";

type CacheEntry = {
  explanation: string;
  timestamp: number;
};

const explanationCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function getExplanationFromCache(symbol: string): string | null {
  const normalizedSymbol = symbol.toUpperCase();
  const cached = explanationCache.get(normalizedSymbol);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
    console.log(`[Explain] Cache hit for ${normalizedSymbol}`);
    return cached.explanation;
  }

  return null;
}

export function setExplanationInCache(symbol: string, explanation: string) {
  const normalizedSymbol = symbol.toUpperCase();
  explanationCache.set(normalizedSymbol, {
    explanation,
    timestamp: Date.now(),
  });
  console.log(`[Explain] Cached new explanation for ${normalizedSymbol}. Cache size now: ${explanationCache.size}`);
}

export function clearExplanationCache(): number {
  const size = explanationCache.size;
  explanationCache.clear();
  console.log(`[Explain] Cleared ${size} cache entries`);
  return size;
}

export function getExplanationCacheStats() {
  console.log("[explainCache] Getting stats, cache size:", explanationCache.size);
  console.log("[explainCache] Cache keys:", Array.from(explanationCache.keys()));
  return {
    size: explanationCache.size,
    keys: Array.from(explanationCache.keys()),
  };
}

export function cleanExpiredExplanations() {
  const now = Date.now();
  for (const [symbol, entry] of explanationCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION_MS) {
      explanationCache.delete(symbol);
    }
  }
}
