/**
 * Rate Limiting Utility
 *
 * Prevents spam and excessive API calls to expensive AI endpoints.
 * Uses in-memory storage with sliding window algorithm.
 *
 * Features:
 * - Per-user rate limiting
 * - Per-endpoint rate limiting
 * - Configurable time windows and request limits
 * - Automatic cleanup of expired entries
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  [key: string]: RateLimitEntry;
};

const store: RateLimitStore = {};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

export type RateLimitConfig = {
  /**
   * Maximum requests allowed within the time window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Optional: Custom identifier (defaults to user email)
   */
  identifier?: string;
};

export type RateLimitResult = {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Remaining requests in current window
   */
  remaining: number;

  /**
   * Timestamp when the rate limit resets (Unix ms)
   */
  resetAt: number;

  /**
   * Seconds until rate limit resets
   */
  retryAfter?: number;
};

/**
 * Check if a request should be rate limited
 *
 * @param endpoint - API endpoint name (e.g., "explain", "sentinel", "summary")
 * @param userEmail - User's email address
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if request is allowed
 */
export function checkRateLimit(
  endpoint: string,
  userEmail: string,
  config: RateLimitConfig
): RateLimitResult {
  const identifier = config.identifier || userEmail;
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  // Get or create entry
  let entry = store[key];

  if (!entry || entry.resetAt < now) {
    // Create new window
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    store[key] = entry;
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Preset rate limit configurations for different endpoint types
 */
export const RateLimitPresets = {
  /**
   * AI Explanation endpoints (expensive OpenAI calls)
   * 10 requests per minute
   */
  AI_EXPLAIN: {
    maxRequests: 20,
    windowSeconds: 60,
  } as RateLimitConfig,

  /**
   * AI Sentinel reports (very expensive, multi-step AI)
   * 3 requests per 5 minutes
   */
  AI_SENTINEL: {
    maxRequests: 3,
    windowSeconds: 300,
  } as RateLimitConfig,

  /**
   * Watchlist summaries (moderate AI cost)
   * 15 requests per minute
   */
  AI_SUMMARY: {
    maxRequests: 15,
    windowSeconds: 60,
  } as RateLimitConfig,

  /**
   * Market data endpoints (external API calls)
   * 30 requests per minute
   */
  MARKET_DATA: {
    maxRequests: 30,
    windowSeconds: 60,
  } as RateLimitConfig,

  /**
   * General API endpoints
   * 60 requests per minute
   */
  GENERAL: {
    maxRequests: 60,
    windowSeconds: 60,
  } as RateLimitConfig,

  /**
   * Authentication endpoints (signup, signin)
   * 5 requests per hour to prevent spam accounts
   */
  AUTH: {
    maxRequests: 5,
    windowSeconds: 3600,
  } as RateLimitConfig,

  /**
   * Password reset requests
   * 3 requests per hour to prevent email bombing
   */
  AUTH_PASSWORD_RESET: {
    maxRequests: 3,
    windowSeconds: 3600,
  } as RateLimitConfig,

  /**
   * Data fetching endpoints (snapshots, news, events)
   * 30 requests per minute
   */
  DATA_FETCH: {
    maxRequests: 30,
    windowSeconds: 60,
  } as RateLimitConfig,

  /**
   * Mutation endpoints (create/delete watchlists, items)
   * 20 requests per minute
   */
  MUTATION: {
    maxRequests: 20,
    windowSeconds: 60,
  } as RateLimitConfig,

  /**
   * Subscription checkout/portal
   * 5 requests per hour
   */
  SUBSCRIPTION: {
    maxRequests: 5,
    windowSeconds: 3600,
  } as RateLimitConfig,
};

/**
 * Create rate limit response headers
 *
 * @param result - Rate limit check result
 * @returns Headers object with rate limit info
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.remaining + (result.allowed ? 1 : 0)),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
    ...(result.retryAfter && {
      "Retry-After": String(result.retryAfter),
    }),
  };
}

/**
 * Helper to create a rate-limited error response
 */
export function createRateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...getRateLimitHeaders(result),
      },
    }
  );
}
