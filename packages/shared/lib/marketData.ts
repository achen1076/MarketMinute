import "server-only";
import { isAfterHours, isPreMarket, shouldShowAfterHours } from "./marketHours";

export type TickerSnapshot = {
  symbol: string;
  name?: string;
  price: number;
  changePct: number;
  change?: number;
  high52w?: number;
  low52w?: number;
  earningsDate?: string;
  marketCap?: number;
  volume?: number;
  avgVolume?: number;
  open?: number;
  previousClose?: number;
  dayLow?: number;
  dayHigh?: number;
  timestamp?: number;
  extendedHoursPrice?: number;
  extendedHoursChangePct?: number;
  extendedHoursSession?: "premarket" | "postmarket";
  extendedHoursTimestamp?: number;
  extendedHoursBid?: number;
  extendedHoursBidSize?: number;
  extendedHoursAsk?: number;
  extendedHoursAskSize?: number;
};

export type AfterMarketQuote = {
  symbol: string;
  bidSize: number;
  bidPrice: number;
  askSize: number;
  askPrice: number;
  volume: number;
  timestamp: number;
};

export type AfterMarketTrade = {
  symbol: string;
  price: number;
  tradeSize: number;
  timestamp: number;
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

  const earningsCalendar = await getEarningsCalendar();

  const indices = symbols.filter((s) => s.startsWith("^"));
  const regularSymbols = symbols.filter((s) => !s.startsWith("^"));

  try {
    const results: TickerSnapshot[] = [];

    if (regularSymbols.length > 0) {
      const symbolsParam = regularSymbols.join(",");
      const url = new URL(
        "https://financialmodelingprep.com/stable/batch-quote"
      );
      url.searchParams.set("symbols", symbolsParam);
      url.searchParams.set("apikey", apiKey);

      const res = await fetch(url.toString(), {
        cache: "no-store",
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
          const batchResults = data.map((quote: any) => {
            const key = quote.symbol.toUpperCase();
            return {
              symbol: key,
              name: quote.name || undefined,
              price: Number(quote.price) || 0,
              changePct: Number(quote.changePercentage) || 0,
              high52w: quote.yearHigh ? Number(quote.yearHigh) : undefined,
              low52w: quote.yearLow ? Number(quote.yearLow) : undefined,
              earningsDate: earningsCalendar[key],
              marketCap: quote.marketCap ? Number(quote.marketCap) : undefined,
              volume: quote.volume ? Number(quote.volume) : undefined,
              avgVolume: quote.avgVolume ? Number(quote.avgVolume) : undefined,
              open: quote.open ? Number(quote.open) : undefined,
              previousClose: quote.previousClose
                ? Number(quote.previousClose)
                : undefined,
              dayLow: quote.dayLow ? Number(quote.dayLow) : undefined,
              dayHigh: quote.dayHigh ? Number(quote.dayHigh) : undefined,
              timestamp: quote.timestamp ? Number(quote.timestamp) : undefined,
            };
          });
          results.push(...batchResults);
        } else {
          console.error("[FMP] Invalid batch quote response:", data);
        }
      }
    }

    const indexMapping: Record<string, string> = {
      "^GSPC": "^GSPC",
      "^DJI": "^DJI",
      "^IXIC": "^IXIC",
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
          cache: "no-store",
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
              name: quote.name || undefined,
              price: Number(quote.price) || 0,
              changePct:
                Number(quote.changesPercentage || quote.changePercentage) || 0,
              change: quote.change ? Number(quote.change) : undefined,
              high52w: quote.yearHigh ? Number(quote.yearHigh) : undefined,
              low52w: quote.yearLow ? Number(quote.yearLow) : undefined,
              volume: quote.volume ? Number(quote.volume) : undefined,
              open: quote.open ? Number(quote.open) : undefined,
              previousClose: quote.previousClose
                ? Number(quote.previousClose)
                : undefined,
              dayLow: quote.dayLow ? Number(quote.dayLow) : undefined,
              dayHigh: quote.dayHigh ? Number(quote.dayHigh) : undefined,
              timestamp: quote.timestamp ? Number(quote.timestamp) : undefined,
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

    const inPremarket = isPreMarket();
    const showAfterHours = shouldShowAfterHours();

    if ((inPremarket || showAfterHours) && regularSymbols.length > 0) {
      try {
        const [afterMarketTrades, afterMarketQuotes] = await Promise.all([
          getAfterMarketTrades(regularSymbols),
          getAfterMarketQuotes(regularSymbols),
        ]);

        for (const snapshot of results) {
          const ahTrade = afterMarketTrades[snapshot.symbol];
          const ahQuote = afterMarketQuotes[snapshot.symbol];

          if (ahTrade && ahTrade.price > 0) {
            const closePrice = snapshot.price;
            const ahChangePct =
              closePrice > 0
                ? ((ahTrade.price - closePrice) / closePrice) * 100
                : 0;

            snapshot.extendedHoursPrice = ahTrade.price;
            snapshot.extendedHoursChangePct = ahChangePct;
            snapshot.extendedHoursSession = inPremarket
              ? "premarket"
              : "postmarket";
            snapshot.extendedHoursTimestamp = ahTrade.timestamp;
          }

          if (ahQuote) {
            if (ahQuote.bidPrice > 0) {
              snapshot.extendedHoursBid = ahQuote.bidPrice;
              snapshot.extendedHoursBidSize = ahQuote.bidSize;
            }
            if (ahQuote.askPrice > 0) {
              snapshot.extendedHoursAsk = ahQuote.askPrice;
              snapshot.extendedHoursAskSize = ahQuote.askSize;
            }
            if (
              !snapshot.extendedHoursSession &&
              (ahQuote.bidPrice > 0 || ahQuote.askPrice > 0)
            ) {
              snapshot.extendedHoursSession = inPremarket
                ? "premarket"
                : "postmarket";
            }
          }
        }
      } catch (error) {
        console.error("[FMP] Error fetching extended hours data:", error);
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

/**
 * Fetch after-market trades for symbols (actual trade prices)
 * Returns a map of symbol -> after-market trade data
 */
export async function getAfterMarketTrades(
  symbols: string[]
): Promise<Record<string, AfterMarketTrade>> {
  if (!symbols.length) return {};

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[FMP] API key not configured for after-market trades");
    return {};
  }

  const regularSymbols = symbols.filter((s) => !s.startsWith("^"));
  if (!regularSymbols.length) return {};

  try {
    const symbolsParam = regularSymbols.join(",");
    const url = new URL(
      "https://financialmodelingprep.com/stable/batch-aftermarket-trade"
    );
    url.searchParams.set("symbols", symbolsParam);
    url.searchParams.set("apikey", apiKey);

    console.log(`[FMP] Fetching after-market trades for: ${symbolsParam}`);

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      const errorBody = await res
        .text()
        .catch(() => "Unable to read error body");
      console.error(
        `[FMP] After-market trade error: ${res.status}\nResponse: ${errorBody}`
      );
      return {};
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("[FMP] Invalid after-market trade response:", data);
      return {};
    }

    const result: Record<string, AfterMarketTrade> = {};
    for (const trade of data) {
      if (trade.symbol) {
        result[trade.symbol.toUpperCase()] = {
          symbol: trade.symbol.toUpperCase(),
          price: Number(trade.price) || 0,
          tradeSize: Number(trade.tradeSize) || 0,
          timestamp: Number(trade.timestamp) || 0,
        };
      }
    }

    console.log(
      `[FMP] Fetched after-market trades for ${
        Object.keys(result).length
      } symbols`
    );
    return result;
  } catch (error) {
    console.error("[FMP] Error fetching after-market trades:", error);
    return {};
  }
}

/**
 * Fetch after-market quotes for symbols (bid/ask data)
 * Returns a map of symbol -> after-market quote data
 */
export async function getAfterMarketQuotes(
  symbols: string[]
): Promise<Record<string, AfterMarketQuote>> {
  if (!symbols.length) return {};

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[FMP] API key not configured for after-market quotes");
    return {};
  }

  // Filter out indices - they don't have after-market quotes
  const regularSymbols = symbols.filter((s) => !s.startsWith("^"));
  if (!regularSymbols.length) return {};

  try {
    const symbolsParam = regularSymbols.join(",");
    const url = new URL(
      "https://financialmodelingprep.com/stable/batch-aftermarket-quote"
    );
    url.searchParams.set("symbols", symbolsParam);
    url.searchParams.set("apikey", apiKey);

    console.log(`[FMP] Fetching after-market quotes for: ${symbolsParam}`);

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      const errorBody = await res
        .text()
        .catch(() => "Unable to read error body");
      console.error(
        `[FMP] After-market quote error: ${res.status}\nResponse: ${errorBody}`
      );
      return {};
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("[FMP] Invalid after-market quote response:", data);
      return {};
    }

    const result: Record<string, AfterMarketQuote> = {};
    for (const quote of data) {
      if (quote.symbol) {
        result[quote.symbol.toUpperCase()] = {
          symbol: quote.symbol.toUpperCase(),
          bidSize: Number(quote.bidSize) || 0,
          bidPrice: Number(quote.bidPrice) || 0,
          askSize: Number(quote.askSize) || 0,
          askPrice: Number(quote.askPrice) || 0,
          volume: Number(quote.volume) || 0,
          timestamp: Number(quote.timestamp) || 0,
        };
      }
    }

    console.log(
      `[FMP] Fetched after-market quotes for ${
        Object.keys(result).length
      } symbols`
    );
    return result;
  } catch (error) {
    console.error("[FMP] Error fetching after-market quotes:", error);
    return {};
  }
}
