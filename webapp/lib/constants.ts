/**
 * Application-wide constants
 *
 * Centralized configuration for cache TTLs, polling intervals, and other shared values.
 */

/**
 * Cache TTL in seconds
 * Used for Redis cache expiration and client-side polling intervals
 */
export const CACHE_TTL_SECONDS = 30;

/**
 * Cache TTL in milliseconds
 * Used for client-side polling intervals and in-memory cache
 */
export const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
