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
 * Check if trading is active (market hours, pre-market, or after-hours)
 */
export function isTradingActive(): boolean {
  return isMarketOpen() || isPreMarket() || isAfterHours();
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

  // If it's already past market open today, move to next day
  if (
    etTime.getHours() > 9 ||
    (etTime.getHours() === 9 && etTime.getMinutes() >= 30)
  ) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  // Skip weekends
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
