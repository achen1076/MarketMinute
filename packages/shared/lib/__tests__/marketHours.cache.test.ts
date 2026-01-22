/**
 * Test script for market price snapshot caching with different refresh rates
 * Run with: npx tsx lib/__tests__/marketHours.cache.test.ts
 */

import {
  isMarketOpen,
  isPreMarket,
  isAfterHours,
  isOvernightPeriod,
  getTickerCacheTTL,
} from "../marketHours";

function formatTime(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

console.log("=".repeat(60));
console.log("MARKET SNAPSHOT CACHE TTL TEST");
console.log("=".repeat(60));

const now = new Date();
const etNow = new Date(
  now.toLocaleString("en-US", { timeZone: "America/New_York" })
);

console.log(`\nCurrent Time (ET): ${formatTime(now)}`);
console.log(
  `Day of Week: ${
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][etNow.getDay()]
  }`
);

console.log("\n--- MARKET STATUS ---");
console.log(`Market Open (9:30-4):     ${isMarketOpen() ? "✅ YES" : "❌ NO"}`);
console.log(`Pre-Market (4-9:30):      ${isPreMarket() ? "✅ YES" : "❌ NO"}`);
console.log(`After-Hours (4-8pm):      ${isAfterHours() ? "✅ YES" : "❌ NO"}`);
console.log(
  `Overnight (8pm-4am):      ${isOvernightPeriod() ? "✅ YES" : "❌ NO"}`
);

console.log("\n--- CACHE TTL ---");
const cacheTTL = getTickerCacheTTL();
console.log(`Ticker Cache TTL: ${cacheTTL} seconds`);

console.log("\n--- EXPECTED REFRESH RATES ---");
console.log("Market hours (9:30-4):          5 seconds");
console.log("Pre-market/After-hours:         60 seconds (1 minute)");
console.log("Overnight (8pm-4am):            300 seconds (5 minutes)");

console.log("\n--- VALIDATION ---");
let isValid = false;
let expectedTTL = 0;
let description = "";

if (isMarketOpen()) {
  expectedTTL = 5;
  description = "Market hours";
  isValid = cacheTTL === expectedTTL;
} else if (isPreMarket() || isAfterHours()) {
  expectedTTL = 60;
  description = "Pre-market/After-hours";
  isValid = cacheTTL === expectedTTL;
} else if (isOvernightPeriod()) {
  expectedTTL = 300;
  description = "Overnight period";
  isValid = cacheTTL === expectedTTL;
} else {
  description = "Outside all trading periods";
  isValid = cacheTTL >= 300; // Should be at least 5 minutes
}

console.log(`Current Period: ${description}`);
console.log(
  `Expected TTL: ${
    expectedTTL > 0 ? expectedTTL + "s" : ">=300s (until premarket)"
  }`
);
console.log(`Actual TTL: ${cacheTTL}s`);
console.log(`Status: ${isValid ? "✅ PASS" : "❌ FAIL"}`);

console.log("\n" + "=".repeat(60));
console.log("TEST COMPLETE");
console.log("=".repeat(60));

process.exit(isValid ? 0 : 1);
