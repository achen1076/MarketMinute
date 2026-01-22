import "server-only";

export type StockEvent = {
  symbol: string;
  type: "earnings" | "dividend" | "conference" | "other";
  title: string;
  date: string; // ISO date string
  description?: string;
  source?: "api" | "news"; // Track where event came from
};

export type MacroEvent = {
  type: "fomc" | "cpi" | "jobs" | "gdp" | "other";
  title: string;
  date: string; // ISO date string
  description?: string;
};

export type TickerEvents = {
  stockEvents: StockEvent[];
  fetchedAt: number;
};

type TickerCacheEntry = {
  events: TickerEvents;
  timestamp: number;
};

// Cache per ticker symbol
const tickerEventsCache = new Map<string, TickerCacheEntry>();

// Cache for macro events (single entry)
const macroEventsCache = {
  events: null as MacroEvent[] | null,
  timestamp: 0,
};

const MACRO_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached events for a single ticker
 */
export function getTickerEventsFromCache(symbol: string): TickerEvents | null {
  const cacheKey = symbol.toUpperCase();
  const cached = tickerEventsCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if any events have passed their date
  const now = new Date();
  const hasExpiredEvents = cached.events.stockEvents.some(
    (e) => new Date(e.date) < now
  );

  if (hasExpiredEvents) {
    console.log(`[Events] Cache expired (event passed) for ${cacheKey}`);
    tickerEventsCache.delete(cacheKey);
    return null;
  }

  return cached.events;
}

/**
 * Set events in cache for a single ticker
 */
export function setTickerEventsInCache(symbol: string, events: TickerEvents) {
  const cacheKey = symbol.toUpperCase();
  tickerEventsCache.set(cacheKey, {
    events,
    timestamp: Date.now(),
  });
  console.log(
    `[Events] Cached ${events.stockEvents.length} events for ${cacheKey}`
  );
}

/**
 * Get cached macro events
 */
export function getMacroEventsFromCache(): MacroEvent[] | null {
  if (!macroEventsCache.events) {
    return null;
  }

  const now = Date.now();
  const age = now - macroEventsCache.timestamp;

  // Check if cache is too old
  if (age > MACRO_CACHE_DURATION_MS) {
    console.log(`[Events] Macro cache expired (age: ${age}ms)`);
    macroEventsCache.events = null;
    return null;
  }

  // Check if any events have passed
  const hasExpiredEvents = macroEventsCache.events.some(
    (e) => new Date(e.date) < new Date()
  );

  if (hasExpiredEvents) {
    console.log(`[Events] Macro cache expired (events passed)`);
    macroEventsCache.events = null;
    return null;
  }

  return macroEventsCache.events;
}

/**
 * Set macro events in cache
 */
export function setMacroEventsInCache(events: MacroEvent[]) {
  macroEventsCache.events = events;
  macroEventsCache.timestamp = Date.now();
  console.log(`[Events] Cached ${events.length} macro events`);
}

/**
 * Clean expired events from cache
 */
export function cleanExpiredEvents() {
  const now = new Date();
  let cleaned = 0;

  // Clean ticker events
  for (const [key, entry] of tickerEventsCache.entries()) {
    const hasExpiredEvents = entry.events.stockEvents.some(
      (e) => new Date(e.date) < now
    );

    if (hasExpiredEvents) {
      tickerEventsCache.delete(key);
      cleaned++;
    }
  }

  // Clean macro events if expired
  if (macroEventsCache.events) {
    const hasExpiredEvents = macroEventsCache.events.some(
      (e) => new Date(e.date) < now
    );
    if (hasExpiredEvents) {
      macroEventsCache.events = null;
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Events] Cleaned ${cleaned} expired cache entries`);
  }
}

/**
 * Get cache statistics
 */
export function getEventsCacheStats() {
  const tickerCount = tickerEventsCache.size;
  const macroCount = macroEventsCache.events ? 1 : 0;
  const totalSize = tickerCount + macroCount;

  console.log("[Events] Getting cache stats, size:", totalSize);
  return {
    size: totalSize,
    keys: Array.from(tickerEventsCache.keys()),
  };
}

/**
 * Clear all events cache
 */
export function clearEventsCache(): number {
  const tickerSize = tickerEventsCache.size;
  const macroSize = macroEventsCache.events ? 1 : 0;
  const totalSize = tickerSize + macroSize;

  tickerEventsCache.clear();
  macroEventsCache.events = null;
  macroEventsCache.timestamp = 0;

  console.log(`[Events] Cleared ${totalSize} cache entries`);
  return totalSize;
}
