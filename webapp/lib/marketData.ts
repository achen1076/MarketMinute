import "server-only";

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

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[FMP] API key not configured");
    return symbols.map((symbol) => ({
      symbol: symbol.toUpperCase(),
      price: 0,
      changePct: 0,
    }));
  }

  // Import earnings calendar
  const earningsCalendar = await getEarningsCalendar();

  try {
    const symbolsParam = symbols.join(",");
    const url = new URL("https://financialmodelingprep.com/stable/batch-quote");
    url.searchParams.set("symbols", symbolsParam);
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      console.error(`[FMP] Batch quote error:`, res.status);
      return symbols.map((symbol) => ({
        symbol: symbol.toUpperCase(),
        price: 0,
        changePct: 0,
      }));
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("[FMP] Invalid batch quote response:", data);
      return symbols.map((symbol) => ({
        symbol: symbol.toUpperCase(),
        price: 0,
        changePct: 0,
      }));
    }

    // Map response to TickerSnapshot format
    const results = data.map((quote: any) => {
      const key = quote.symbol.toUpperCase();
      return {
        symbol: key,
        price: Number(quote.price) || 0,
        changePct: Number(quote.changePercentage) || 0,
        high52w: quote.yearHigh ? Number(quote.yearHigh) : undefined,
        low52w: quote.yearLow ? Number(quote.yearLow) : undefined,
        earningsDate: earningsCalendar[key],
      };
    });

    return results;
  } catch (error) {
    console.error(`[FMP] Error fetching batch quotes:`, error);
    return symbols.map((symbol) => ({
      symbol: symbol.toUpperCase(),
      price: 0,
      changePct: 0,
    }));
  }
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
