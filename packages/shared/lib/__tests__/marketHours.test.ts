/**
 * Test script for market hours and cache TTL logic
 * Run with: npx tsx lib/__tests__/marketHours.test.ts
 */

import {
  isMarketOpen,
  isPreMarket,
  isAfterHours,
  isOvernightPeriod,
  isTradingActive,
  shouldShowAfterHours,
  getNextMarketOpen,
  getNextPreMarket,
  getTickerCacheTTL,
  getChartCacheTTL,
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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

console.log("=".repeat(60));
console.log("MARKET HOURS & CACHE TTL TEST");
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
console.log(`Market Open:      ${isMarketOpen() ? "✅ YES" : "❌ NO"}`);
console.log(`Pre-Market:       ${isPreMarket() ? "✅ YES" : "❌ NO"}`);
console.log(`After-Hours:      ${isAfterHours() ? "✅ YES" : "❌ NO"}`);
console.log(`Overnight Period: ${isOvernightPeriod() ? "✅ YES" : "❌ NO"}`);
console.log(`Trading Active:   ${isTradingActive() ? "✅ YES" : "❌ NO"}`);
console.log(`Show After-Hours: ${shouldShowAfterHours() ? "✅ YES" : "❌ NO"}`);

console.log("\n--- NEXT EVENTS ---");
const nextOpen = getNextMarketOpen();
const nextPreMarket = getNextPreMarket();
console.log(`Next Market Open:  ${formatTime(nextOpen)}`);
console.log(`Next Pre-Market:   ${formatTime(nextPreMarket)}`);

console.log("\n--- CACHE TTL CALCULATIONS ---");
const tickerTTL = getTickerCacheTTL(5);
const chartTTL = getChartCacheTTL(60);

console.log(`Ticker Cache TTL:  ${formatDuration(tickerTTL)} (${tickerTTL}s)`);
console.log(`Chart Cache TTL:   ${formatDuration(chartTTL)} (${chartTTL}s)`);

// Calculate expected values for verification
const msUntilPreMarket = nextPreMarket.getTime() - now.getTime();
const msUntilOpen = nextOpen.getTime() - now.getTime();
const expectedTickerTTL = Math.floor(msUntilPreMarket / 1000) - 300; // minus 5 min cushion
const expectedChartTTL = Math.floor(msUntilOpen / 1000) - 300; // minus 5 min cushion

console.log("\n--- VERIFICATION ---");
if (isTradingActive()) {
  console.log("✅ Trading active - using default TTLs");
  console.log(`   Ticker TTL should be: 5s (default)`);
  console.log(`   Chart TTL should be: 60s (default)`);
} else {
  console.log(
    `Expected Ticker TTL (with 5min cushion): ${formatDuration(
      Math.max(5, expectedTickerTTL)
    )}`
  );
  console.log(
    `Expected Chart TTL (with 5min cushion):  ${formatDuration(
      Math.max(60, expectedChartTTL)
    )}`
  );

  const tickerMatch =
    tickerTTL === Math.max(5, Math.min(expectedTickerTTL, 604800));
  const chartMatch =
    chartTTL === Math.max(60, Math.min(expectedChartTTL, 604800));

  console.log(`\nTicker TTL correct: ${tickerMatch ? "✅ YES" : "❌ NO"}`);
  console.log(`Chart TTL correct:  ${chartMatch ? "✅ YES" : "❌ NO"}`);
}

// Test specific scenarios
console.log("\n--- SCENARIO TESTS ---");

// Test 1: Verify cushion is applied
if (!isTradingActive()) {
  const rawSecondsToPreMarket = Math.floor(msUntilPreMarket / 1000);
  const rawSecondsToOpen = Math.floor(msUntilOpen / 1000);

  const tickerHasCushion = tickerTTL <= rawSecondsToPreMarket - 300 + 1; // +1 for timing variance
  const chartHasCushion = chartTTL <= rawSecondsToOpen - 300 + 1;

  console.log(
    `[Test 1] Ticker TTL has 5-min cushion: ${
      tickerHasCushion ? "✅ PASS" : "❌ FAIL"
    }`
  );
  console.log(
    `[Test 2] Chart TTL has 5-min cushion:  ${
      chartHasCushion ? "✅ PASS" : "❌ FAIL"
    }`
  );
} else {
  console.log("[Test 1-2] Skipped (trading active, using default TTLs)");
}

// Test 3: Verify minimum TTL is respected
const minTickerRespected = tickerTTL >= 5;
const minChartRespected = chartTTL >= 60;
console.log(
  `[Test 3] Ticker TTL >= 5s minimum:  ${
    minTickerRespected ? "✅ PASS" : "❌ FAIL"
  }`
);
console.log(
  `[Test 4] Chart TTL >= 60s minimum:  ${
    minChartRespected ? "✅ PASS" : "❌ FAIL"
  }`
);

// Test 5: Verify max TTL cap
const maxTickerCapped = tickerTTL <= 604800;
const maxChartCapped = chartTTL <= 604800;
console.log(
  `[Test 5] Ticker TTL <= 1 week cap:    ${
    maxTickerCapped ? "✅ PASS" : "❌ FAIL"
  }`
);
console.log(
  `[Test 6] Chart TTL <= 1 week cap:     ${
    maxChartCapped ? "✅ PASS" : "❌ FAIL"
  }`
);

console.log("\n" + "=".repeat(60));
console.log("TEST COMPLETE");
console.log("=".repeat(60));
