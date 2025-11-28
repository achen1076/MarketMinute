// lib/smartAlerts.ts
import "server-only";

export type SmartAlert = {
  type: "price_move" | "near_52w_high" | "near_52w_low" | "earnings_soon";
  message: string;
  severity: "info" | "warning" | "critical";
};

export type SmartAlertFlags = {
  hit_3pct_today: boolean;
  within_2pct_52w_high: boolean;
  within_2pct_52w_low: boolean;
  earnings_within_5_days: boolean;
  alerts: SmartAlert[];
};

/**
 * Compute smart alert flags for a symbol
 * Pure computation - no async operations needed
 */
export function computeSmartAlerts(
  symbol: string,
  changePct: number,
  price: number,
  high52w?: number,
  low52w?: number,
  earningsDate?: string
): SmartAlertFlags {
  const alerts: SmartAlert[] = [];

  // Check for significant price move (±3%)
  const hit_3pct_today = Math.abs(changePct) >= 3;
  if (hit_3pct_today) {
    alerts.push({
      type: "price_move",
      message: `${symbol} moved ${changePct >= 0 ? "+" : ""}${changePct.toFixed(
        2
      )}% today`,
      severity: Math.abs(changePct) >= 5 ? "critical" : "warning",
    });
  }

  // Check proximity to 52-week high
  let within_2pct_52w_high = false;
  if (high52w && price > 0) {
    const distanceFromHigh = ((high52w - price) / high52w) * 100;
    within_2pct_52w_high = distanceFromHigh <= 2 && distanceFromHigh >= 0;

    if (within_2pct_52w_high) {
      alerts.push({
        type: "near_52w_high",
        message: `${symbol} is within ${distanceFromHigh.toFixed(
          1
        )}% of its 52-week high ($${high52w.toFixed(2)})`,
        severity: "info",
      });
    }
  }

  // Check proximity to 52-week low
  let within_2pct_52w_low = false;
  if (low52w && price > 0) {
    const distanceFromLow = ((price - low52w) / low52w) * 100;
    within_2pct_52w_low = distanceFromLow <= 2 && distanceFromLow >= 0;

    if (within_2pct_52w_low) {
      alerts.push({
        type: "near_52w_low",
        message: `${symbol} is within ${distanceFromLow.toFixed(
          1
        )}% of its 52-week low ($${low52w.toFixed(2)})`,
        severity: "warning",
      });
    }
  }

  // Check for upcoming earnings
  let earnings_within_5_days = false;
  if (earningsDate) {
    const today = new Date();
    const earnings = new Date(earningsDate);
    const diffDays = Math.ceil(
      (earnings.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    earnings_within_5_days = diffDays >= 0 && diffDays <= 5;

    if (earnings_within_5_days) {
      alerts.push({
        type: "earnings_soon",
        message: `${symbol} reports earnings in ${diffDays} day${
          diffDays === 1 ? "" : "s"
        }`,
        severity: "info",
      });
    }
  }

  return {
    hit_3pct_today,
    within_2pct_52w_high,
    within_2pct_52w_low,
    earnings_within_5_days,
    alerts,
  };
}

/**
 * Generate a summary line for dashboard about alerts across all symbols
 */
export function summarizeAlerts(
  symbolAlerts: Map<string, SmartAlertFlags>
): string {
  let big_movers = 0;
  let near_highs = 0;
  let near_lows = 0;
  let earnings_soon = 0;

  for (const [, flags] of symbolAlerts) {
    if (flags.hit_3pct_today) big_movers++;
    if (flags.within_2pct_52w_high) near_highs++;
    if (flags.within_2pct_52w_low) near_lows++;
    if (flags.earnings_within_5_days) earnings_soon++;
  }

  const parts: string[] = [];

  if (big_movers > 0) {
    parts.push(`${big_movers} hit ±3% moves`);
  }

  if (near_highs > 0) {
    parts.push(`${near_highs} near 52-week highs`);
  }

  if (near_lows > 0) {
    parts.push(`${near_lows} near 52-week lows`);
  }

  if (earnings_soon > 0) {
    parts.push(`${earnings_soon} with earnings this week`);
  }

  if (parts.length === 0) {
    return "No significant alerts today";
  }

  return parts.join(" • ");
}
