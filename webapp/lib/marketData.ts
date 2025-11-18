import "server-only";
import { getSchwabAccessToken } from "@/lib/schwabAuth";

export type TickerSnapshot = {
  symbol: string;
  price: number;
  changePct: number;
  high52w?: number;
  low52w?: number;
  earningsDate?: string;
};

export async function getSnapshotsForSymbols(
  symbols: string[]
): Promise<TickerSnapshot[]> {
  if (!symbols.length) return [];

  const accessToken = await getSchwabAccessToken();

  const url = new URL("https://api.schwabapi.com/marketdata/v1/quotes");
  url.searchParams.set("symbols", symbols.join(","));

  let res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 30 },
  });

  if (res.status === 401) {
    console.warn("[Schwab] 401 from quotes, forcing token refresh + retry");
    const newAccessToken = await getSchwabAccessToken();
    res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
      next: { revalidate: 30 },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("Schwab quotes error:", res.status, text);
    return symbols.map((symbol) => ({
      symbol: symbol.toUpperCase(),
      price: 0,
      changePct: 0,
    }));
  }

  const data = await res.json();

  // Import earnings calendar
  const earningsCalendar = await getEarningsCalendar();

  return symbols.map((symbol) => {
    const key = symbol.toUpperCase();
    const q: any = data[key] ?? {};
    const quote = q.quote ?? {};
    const regular = q.regular ?? {};
    const fundamental = q.fundamental ?? {};

    const price =
      regular.regularMarketLastPrice ?? quote.lastPrice ?? quote.mark ?? 0;

    const rawPct =
      regular.regularMarketPercentChange ??
      quote.netPercentChange ??
      quote.markPercentChange ??
      0;

    const changePct = rawPct;

    // Extract 52-week high/low from various possible fields
    const high52w =
      quote.fiftyTwoWeekHigh ??
      quote['52WeekHigh'] ??
      fundamental.high52 ??
      regular.fiftyTwoWeekHigh;

    const low52w =
      quote.fiftyTwoWeekLow ??
      quote['52WeekLow'] ??
      fundamental.low52 ??
      regular.fiftyTwoWeekLow;

    return {
      symbol: key,
      price: Number(price) || 0,
      changePct: Number(changePct) || 0,
      high52w: high52w ? Number(high52w) : undefined,
      low52w: low52w ? Number(low52w) : undefined,
      earningsDate: earningsCalendar[key],
    };
  });
}

/**
 * Get earnings calendar (stopgap implementation)
 * Returns a map of symbol -> earnings date string (YYYY-MM-DD)
 */
async function getEarningsCalendar(): Promise<Record<string, string>> {
  // TODO: Replace with real earnings API or database
  // For now, return empty - this is a placeholder for future enhancement
  // You can manually add upcoming earnings here as needed:
  return {
    // Example: "AAPL": "2025-01-30",
    // Example: "MSFT": "2025-01-28",
  };
}
