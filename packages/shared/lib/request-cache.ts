import { prisma } from "@/lib/prisma";
import { redis } from "@shared/lib/redis";

type CachedUser = {
  id: string;
  email: string;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
};

const SYMBOLS_CACHE_TTL = 31536000; // 1 year (invalidated on mutation)

// Request-scoped user cache (in-memory, per-request)
const requestUserCache = new Map<string, CachedUser>();

/**
 * Get user by email with request-scoped caching.
 * Multiple calls with same email in same request return cached result.
 * Call clearRequestCache() at end of request if needed.
 */
export async function getCachedUser(email: string): Promise<CachedUser | null> {
  // Check request-scoped cache first
  const cached = requestUserCache.get(email);
  if (cached) return cached;

  // Query database
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  if (user && user.email) {
    const cachedUser: CachedUser = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
    };
    requestUserCache.set(email, cachedUser);
    return cachedUser;
  }

  return null;
}

/**
 * Clear request-scoped cache (call at end of request if needed)
 */
export function clearRequestCache() {
  requestUserCache.clear();
}

// ============================================
// Redis-cached watchlist symbols
// ============================================

type CachedSymbols = string[];

/**
 * Get symbols for a watchlist with Redis caching.
 * Invalidated when watchlist items change.
 */
export async function getCachedWatchlistSymbols(
  watchlistId: string
): Promise<CachedSymbols | null> {
  if (!redis) return null;

  try {
    const cacheKey = `watchlist:${watchlistId}:symbols`;
    return await redis.get<CachedSymbols>(cacheKey);
  } catch {
    return null;
  }
}

/**
 * Set symbols cache for a watchlist
 */
export async function setCachedWatchlistSymbols(
  watchlistId: string,
  symbols: string[]
): Promise<void> {
  if (!redis) return;

  try {
    const cacheKey = `watchlist:${watchlistId}:symbols`;
    await redis.setex(cacheKey, SYMBOLS_CACHE_TTL, symbols);
  } catch (error) {
    console.error("[WatchlistCache] Failed to cache symbols:", error);
  }
}

/**
 * Invalidate all watchlist caches for a given watchlistId
 */
export async function invalidateWatchlistCaches(
  watchlistId: string
): Promise<void> {
  if (!redis) return;

  try {
    await Promise.all([
      redis.del(`watchlist:${watchlistId}:items`),
      redis.del(`watchlist:${watchlistId}:data`),
      redis.del(`watchlist:${watchlistId}:symbols`),
    ]);
  } catch (error) {
    console.error("[WatchlistCache] Failed to invalidate:", error);
  }
}
