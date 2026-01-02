/**
 * Market Hours Utility
 *
 * Determines if the US stock market is currently open for trading.
 * Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday (excluding holidays)
 */

/**
 * Check if the US stock market is currently open
 * Returns true during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
 *
 * Note: This does not account for market holidays (e.g., Thanksgiving, Christmas)
 * For production use, consider integrating a holiday calendar API
 */
export function isMarketOpen(): boolean {
  const now = new Date();

  // Convert to ET timezone
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  // Check if it's a weekend
  const day = etTime.getDay();
  if (day === 0 || day === 6) {
    return false; // Sunday = 0, Saturday = 6
  }

  // Get current time in ET
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Market hours: 9:30 AM (570 minutes) to 4:05 PM (965 minutes)
  // Extended to 4:05 PM to give a breather for final settlements
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60 + 5; // 4:05 PM

  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}

/**
 * Check if the market is in pre-market hours (4:00 AM - 9:30 AM ET)
 */
export function isPreMarket(): boolean {
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = etTime.getDay();
  if (day === 0 || day === 6) return false;

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const preMarketStart = 4 * 60; // 4:00 AM
  const marketOpen = 9 * 60 + 30; // 9:30 AM

  return timeInMinutes >= preMarketStart && timeInMinutes < marketOpen;
}

/**
 * Check if the market is in after-hours (4:05 PM - 8:00 PM ET)
 */
export function isAfterHours(): boolean {
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = etTime.getDay();
  if (day === 0 || day === 6) return false;

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketClose = 16 * 60 + 5; // 4:05 PM
  const afterHoursEnd = 20 * 60; // 8:00 PM

  return timeInMinutes >= marketClose && timeInMinutes < afterHoursEnd;
}

/**
 * Check if we're in the overnight period (8:00 PM - 4:00 AM next day)
 * During this time, we show the last after-hours price from the previous session
 */
export function isOvernightPeriod(): boolean {
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = etTime.getDay();
  // On weekends, consider it overnight period
  if (day === 0 || day === 6) return true;

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const afterHoursEnd = 20 * 60; // 8:00 PM
  const preMarketStart = 4 * 60; // 4:00 AM

  // After 8 PM or before 4 AM (overnight)
  return timeInMinutes >= afterHoursEnd || timeInMinutes < preMarketStart;
}

/**
 * Check if trading is active (market hours, pre-market, or after-hours)
 */
export function isTradingActive(): boolean {
  return isMarketOpen() || isPreMarket() || isAfterHours();
}

/**
 * Get the last market open time
 * Returns a Date object for when the market last opened (or today's open if market is open)
 * Used to determine if cached data is stale (from a previous trading session)
 */
export function getLastMarketOpenTime(): Date {
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  let lastOpen = new Date(etTime);
  lastOpen.setHours(9, 30, 0, 0);

  const day = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM

  // If it's before market open today, use previous trading day
  if (timeInMinutes < marketOpenMinutes) {
    lastOpen.setDate(lastOpen.getDate() - 1);
  }

  // If it's a weekend, go back to Friday
  if (day === 0) {
    // Sunday - go back to Friday
    lastOpen.setDate(lastOpen.getDate() - 2);
  } else if (day === 6) {
    // Saturday - go back to Friday
    lastOpen.setDate(lastOpen.getDate() - 1);
  } else if (day === 1 && timeInMinutes < marketOpenMinutes) {
    // Monday before market open - go back to Friday
    lastOpen.setDate(lastOpen.getDate() - 2);
  }

  return lastOpen;
}

/**
 * Get the next market open time
 * Returns a Date object for when the market will next open
 */
export function getNextMarketOpen(): Date {
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  let nextOpen = new Date(etTime);
  nextOpen.setHours(9, 30, 0, 0);

  if (
    etTime.getHours() > 9 ||
    (etTime.getHours() === 9 && etTime.getMinutes() >= 30)
  ) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  return nextOpen;
}

/**
 * Get time until market opens (in milliseconds)
 * Returns 0 if market is currently open
 */
export function getTimeUntilMarketOpen(): number {
  if (isMarketOpen()) return 0;

  const now = new Date();
  const nextOpen = getNextMarketOpen();

  return nextOpen.getTime() - now.getTime();
}

/**
 * Get the next pre-market time (4:00 AM ET next trading day)
 * Returns a Date object for when pre-market will next start
 */
export function getNextPreMarket(): Date {
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  let nextPreMarket = new Date(etTime);
  nextPreMarket.setHours(4, 0, 0, 0);

  // If it's already past 4:00 AM today, move to next day
  if (etTime.getHours() >= 4) {
    nextPreMarket.setDate(nextPreMarket.getDate() + 1);
  }

  // Skip weekends
  while (nextPreMarket.getDay() === 0 || nextPreMarket.getDay() === 6) {
    nextPreMarket.setDate(nextPreMarket.getDate() + 1);
  }

  return nextPreMarket;
}

/**
 * Check if we should fetch/display after-hours prices
 * This includes actual after-hours (4:05 PM - 8:00 PM) AND overnight period (8:00 PM - 4:00 AM)
 */
export function shouldShowAfterHours(): boolean {
  return isAfterHours() || isOvernightPeriod();
}

const CACHE_CUSHION_SECONDS = 5 * 60; // 5 minutes before premarket/open

/**
 * Get cache TTL in seconds for ticker/summary/explain data
 * During trading hours (pre-market, market, after-hours): return default TTL (5 seconds)
 * Outside trading hours: return seconds until 5 min before next pre-market
 */
export function getTickerCacheTTL(defaultTTL: number = 5): number {
  if (isTradingActive()) {
    return defaultTTL;
  }

  const now = new Date();
  const nextPreMarket = getNextPreMarket();
  const secondsUntilPreMarket = Math.floor(
    (nextPreMarket.getTime() - now.getTime()) / 1000
  );

  // Expire 5 min early to refresh before premarket starts
  const ttlWithCushion = secondsUntilPreMarket - CACHE_CUSHION_SECONDS;
  return Math.max(defaultTTL, Math.min(ttlWithCushion, 86400));
}

/**
 * Get cache TTL in seconds for historical chart data
 * During market hours: return default TTL (60 seconds for 1D, 300 for others)
 * Outside market hours: return seconds until 5 min before next market open
 */
export function getChartCacheTTL(defaultTTL: number): number {
  if (isMarketOpen()) {
    return defaultTTL;
  }

  const now = new Date();
  const nextOpen = getNextMarketOpen();
  const secondsUntilOpen = Math.floor(
    (nextOpen.getTime() - now.getTime()) / 1000
  );

  // Expire 5 min early to refresh before market opens
  const ttlWithCushion = secondsUntilOpen - CACHE_CUSHION_SECONDS;
  return Math.max(defaultTTL, Math.min(ttlWithCushion, 86400));
}
