/**
 * Application-wide constants
 *
 * Centralized configuration for cache TTLs, polling intervals, and other shared values.
 */

/**
 * Cache TTL in seconds (during market hours)
 * Used for Redis cache expiration and client-side polling intervals
 *
 * Note: When market is closed, cache TTL is extended to 30 minutes (CACHE_TTL_SECONDS * 60)
 * since prices don't change outside trading hours.
 */
export const CACHE_TTL_SECONDS = 30;

/**
 * Cache TTL in milliseconds
 * Used for client-side polling intervals and in-memory cache
 *
 * Note: Client-side polling only occurs during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
 * to reduce unnecessary API calls when the market is closed.
 */
export const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
