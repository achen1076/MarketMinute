import "server-only";

// Cache registry for centralized management
export const cacheRegistry = {
  explanations: null as Map<string, any> | null,
  summaries: null as Map<string, any> | null,
};

export function registerExplanationCache(cache: Map<string, any>) {
  cacheRegistry.explanations = cache;
}

export function registerSummaryCache(cache: Map<string, any>) {
  cacheRegistry.summaries = cache;
}

export function clearAllCaches() {
  let cleared = 0;

  if (cacheRegistry.explanations) {
    const size = cacheRegistry.explanations.size;
    cacheRegistry.explanations.clear();
    cleared += size;
    console.log(`[Cache] Cleared ${size} explanation entries`);
  }

  if (cacheRegistry.summaries) {
    const size = cacheRegistry.summaries.size;
    cacheRegistry.summaries.clear();
    cleared += size;
    console.log(`[Cache] Cleared ${size} summary entries`);
  }

  return {
    success: true,
    totalCleared: cleared,
    timestamp: new Date().toISOString(),
  };
}

export function getCacheStats() {
  return {
    explanations: {
      size: cacheRegistry.explanations?.size ?? 0,
      registered: !!cacheRegistry.explanations,
    },
    summaries: {
      size: cacheRegistry.summaries?.size ?? 0,
      registered: !!cacheRegistry.summaries,
    },
  };
}
