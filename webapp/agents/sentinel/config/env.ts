// sentinel/config/env.ts
import "dotenv/config";

/**
 * Centralized environment loader for Sentinel Agent
 * -------------------------------------------------
 * Loads all secrets and runtime configuration needed
 * by the Sentinel agent subsystem.
 */

export const SENTINEL_ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SCHWAB_APP_KEY: process.env.SCHWAB_APP_KEY, // Client ID
  SCHWAB_APP_SECRET: process.env.SCHWAB_APP_SECRET, // Client Secret
  SCHWAB_REFRESH_TOKEN: process.env.SCHWAB_REFRESH_TOKEN,
  SCHWAB_REDIRECT_URI: process.env.SCHWAB_REDIRECT_URI,
  FMP_API_KEY: process.env.FMP_API_KEY,
  FRED_API_KEY: process.env.FRED_API_KEY,
  NOTIFY_API_KEY: process.env.NOTIFY_API_KEY,
  REDIS_URL: process.env.SENTINEL_REDIS_URL || null,
  AGENT_TOKEN: process.env.SENTINEL_AGENT_TOKEN,
  ENVIRONMENT: process.env.NODE_ENV || "development",
};

function warnMissing(name: string) {
  console.warn(`[Sentinel][WARN] Missing environment variable: ${name}`);
}

if (!SENTINEL_ENV.OPENAI_API_KEY) warnMissing("OPENAI_API_KEY");
if (!SENTINEL_ENV.SCHWAB_APP_KEY) warnMissing("SCHWAB_APP_KEY");
if (!SENTINEL_ENV.SCHWAB_APP_SECRET) warnMissing("SCHWAB_APP_SECRET");
if (!SENTINEL_ENV.FMP_API_KEY) warnMissing("FMP_API_KEY");
if (!SENTINEL_ENV.FRED_API_KEY) warnMissing("FRED_API_KEY");
