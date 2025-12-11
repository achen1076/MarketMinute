import "server-only";

export type TickerSnapshot = {
  symbol: string;
  price: number;
  changePct: number;
  high52w?: number;
  low52w?: number;
  earningsDate?: string;
};

const apiCallTimestamps: number[] = [];
const MAX_CALLS_PER_MINUTE = 300;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkFMPRateLimit(): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  while (
    apiCallTimestamps.length > 0 &&
    apiCallTimestamps[0] < now - RATE_LIMIT_WINDOW_MS
  ) {
    apiCallTimestamps.shift();
  }

  if (apiCallTimestamps.length >= MAX_CALLS_PER_MINUTE) {
    const oldestCall = apiCallTimestamps[0];
    const retryAfter = Math.ceil(
      (oldestCall + RATE_LIMIT_WINDOW_MS - now) / 1000
    );
    console.warn(
      `[FMP RateLimit] BLOCKED: ${apiCallTimestamps.length}/${MAX_CALLS_PER_MINUTE} calls in last 60s. Retry in ${retryAfter}s`
    );
    return { allowed: false, retryAfter };
  }

  // Record this API call
  apiCallTimestamps.push(now);
  console.log(
    `[FMP RateLimit] ALLOWED: ${apiCallTimestamps.length}/${MAX_CALLS_PER_MINUTE} calls in last 60s`
  );
  return { allowed: true };
}

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

  const rateLimitCheck = checkFMPRateLimit();
  if (!rateLimitCheck.allowed) {
    console.warn(
      `[FMP] Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter}s. Returning empty snapshots.`
    );
    return symbols.map((symbol) => ({
      symbol: symbol.toUpperCase(),
      price: 0,
      changePct: 0,
    }));
  }

  // Import earnings calendar
  const earningsCalendar = await getEarningsCalendar();

  // Split indices (^) from regular symbols - indices must be fetched individually
  const indices = symbols.filter((s) => s.startsWith("^"));
  const regularSymbols = symbols.filter((s) => !s.startsWith("^"));

  try {
    const results: TickerSnapshot[] = [];

    // Fetch regular symbols via batch endpoint
    if (regularSymbols.length > 0) {
      const symbolsParam = regularSymbols.join(",");
      const url = new URL(
        "https://financialmodelingprep.com/stable/batch-quote"
      );
      url.searchParams.set("symbols", symbolsParam);
      url.searchParams.set("apikey", apiKey);

      const res = await fetch(url.toString(), {
        next: { revalidate: 5 },
      });

      if (!res.ok) {
        const errorBody = await res
          .text()
          .catch(() => "Unable to read error body");

        if (res.status === 402) {
          console.error(
            `[FMP] 402 Payment Required - API limit reached or subscription issue.\n` +
              `Check your FMP account at: https://site.financialmodelingprep.com/developer/docs/pricing\n` +
              `Response: ${errorBody}`
          );
        } else {
          console.error(
            `[FMP] Batch quote error: ${res.status}\n` +
              `Response: ${errorBody}`
          );
        }
      } else {
        const data = await res.json();

        if (Array.isArray(data)) {
          // Map response to TickerSnapshot format
          const batchResults = data.map((quote: any) => {
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
          results.push(...batchResults);
        } else {
          console.error("[FMP] Invalid batch quote response:", data);
        }
      }
    }

    // Fetch indices individually (batch-quote doesn't support them)
    // Map Yahoo-style symbols to FMP format
    const indexMapping: Record<string, string> = {
      "^GSPC": "^GSPC", // S&P 500
      "^DJI": "^DJI", // Dow Jones
      "^IXIC": "^IXIC", // Nasdaq
    };

    for (const indexSymbol of indices) {
      try {
        const fmpSymbol = indexMapping[indexSymbol] || indexSymbol;
        const url = new URL("https://financialmodelingprep.com/stable/quote");
        url.searchParams.set("symbol", fmpSymbol);
        url.searchParams.set("apikey", apiKey);

        console.log(
          `[FMP] Fetching index: ${indexSymbol} from ${url.toString()}`
        );

        const res = await fetch(url.toString(), {
          next: { revalidate: 5 },
        });

        if (res.ok) {
          const data = await res.json();
          console.log(
            `[FMP] Response for ${indexSymbol}:`,
            JSON.stringify(data).substring(0, 200)
          );

          if (Array.isArray(data) && data.length > 0) {
            const quote = data[0];
            results.push({
              symbol: indexSymbol.toUpperCase(),
              price: Number(quote.price) || 0,
              changePct:
                Number(quote.changesPercentage || quote.changePercentage) || 0,
              high52w: quote.yearHigh ? Number(quote.yearHigh) : undefined,
              low52w: quote.yearLow ? Number(quote.yearLow) : undefined,
            });
            console.log(
              `[FMP] Successfully fetched ${indexSymbol}: $${quote.price} (${
                quote.changesPercentage || quote.changePercentage
              }%)`
            );
          } else {
            console.error(
              `[FMP] Empty or invalid data for ${indexSymbol}:`,
              data
            );
            results.push({
              symbol: indexSymbol.toUpperCase(),
              price: 0,
              changePct: 0,
            });
          }
        } else {
          const errorText = await res.text();
          console.error(
            `[FMP] Failed to fetch index ${indexSymbol}: ${res.status}\nResponse: ${errorText}`
          );
          results.push({
            symbol: indexSymbol.toUpperCase(),
            price: 0,
            changePct: 0,
          });
        }
      } catch (error) {
        console.error(`[FMP] Error fetching index ${indexSymbol}:`, error);
        results.push({
          symbol: indexSymbol.toUpperCase(),
          price: 0,
          changePct: 0,
        });
      }
    }

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
