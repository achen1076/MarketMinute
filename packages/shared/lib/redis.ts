/**
 * Redis Client Configuration
 *
 * Uses Upstash Redis for serverless-compatible caching.
 * Falls back to in-memory cache if Redis is not configured.
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

// Initialize Redis client if credentials are available
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log("[Redis] Connected to Upstash Redis");
} else {
  console.log("[Redis] Redis credentials not found, using in-memory cache");
}

export { redis };
