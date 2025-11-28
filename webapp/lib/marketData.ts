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

  // FMP free tier requires individual requests per symbol
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const url = new URL("https://financialmodelingprep.com/stable/quote");
        url.searchParams.set("symbol", symbol);
        url.searchParams.set("apikey", apiKey);

        const res = await fetch(url.toString(), {
          next: { revalidate: 30 },
        });

        if (!res.ok) {
          console.error(`[FMP] Quote error for ${symbol}:`, res.status);
          return {
            symbol: symbol.toUpperCase(),
            price: 0,
            changePct: 0,
          };
        }

        const data = await res.json();
        const quote = Array.isArray(data) && data.length > 0 ? data[0] : {};

        const key = symbol.toUpperCase();
        const price = quote.price ?? 0;
        const changePct = quote.changePercentage ?? 0;
        const high52w = quote.yearHigh;
        const low52w = quote.yearLow;

        return {
          symbol: key,
          price: Number(price) || 0,
          changePct: Number(changePct) || 0,
          high52w: high52w ? Number(high52w) : undefined,
          low52w: low52w ? Number(low52w) : undefined,
          earningsDate: earningsCalendar[key],
        };
      } catch (error) {
        console.error(`[FMP] Error fetching ${symbol}:`, error);
        return {
          symbol: symbol.toUpperCase(),
          price: 0,
          changePct: 0,
        };
      }
    })
  );

  return results;
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
