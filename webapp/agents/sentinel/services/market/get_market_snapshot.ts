import { MarketSnapshot, MarketIndex } from "../../agent/types";

/*
  List of index tickers to monitor for market-wide movement.
*/
const INDEX_SYMBOLS = ["SPY", "QQQ", "IWM", "DIA"];

/*
  Sector ETFs used for rotation and dispersion analysis.
*/
const SECTOR_SYMBOLS = [
  "XLK",
  "XLF",
  "XLE",
  "XLY",
  "XLP",
  "XLV",
  "XLI",
  "XLB",
  "XLU",
  "XLRE",
];

/*
  Fetch quotes from FMP.
  Uses individual calls via v3/quote which works for all symbol types (ETFs, indices).
*/
async function fetchFMPQuotes(symbols: string[]): Promise<MarketIndex[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[Sentinel] FMP API key not configured");
    throw new Error("FMP API key not configured");
  }

  const results: MarketIndex[] = [];

  for (const symbol of symbols) {
    try {
      // Use stable endpoint with query parameter (NOT path parameter)
      const url = new URL("https://financialmodelingprep.com/stable/quote");
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("apikey", apiKey);

      const res = await fetch(url.toString());

      if (!res.ok) {
        const errorBody = await res
          .text()
          .catch(() => "Unable to read error body");

        if (res.status === 402) {
          console.error(
            `[Sentinel] 402 Payment Required for ${symbol} - API limit reached.\n` +
              `Check your FMP account at: https://site.financialmodelingprep.com/developer/docs/pricing\n` +
              `Response: ${errorBody}`
          );
        } else {
          console.error(
            `[Sentinel] FMP quote error for ${symbol}: ${res.status}\n` +
              `Response: ${errorBody}`
          );
        }

        results.push({
          symbol: symbol.toUpperCase(),
          changePct: 0,
          price: null,
        });
        continue;
      }

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.error(`[Sentinel] Invalid quote response for ${symbol}:`, data);
        results.push({
          symbol: symbol.toUpperCase(),
          changePct: 0,
          price: null,
        });
        continue;
      }

      const quote = data[0];
      const price = quote.price ?? null;
      const changePct = quote.changesPercentage ?? quote.changePercentage ?? 0;

      results.push({
        symbol: symbol.toUpperCase(),
        changePct: Number(changePct) || 0,
        price: price ? Number(price) : null,
      });
    } catch (error) {
      console.error(`[Sentinel] Error fetching quote for ${symbol}:`, error);
      results.push({
        symbol: symbol.toUpperCase(),
        changePct: 0,
        price: null,
      });
    }
  }

  return results;
}

/*
  Loads index performance for SPY, QQQ, IWM, DIA.
*/
async function loadIndexData(): Promise<MarketIndex[]> {
  return fetchFMPQuotes(INDEX_SYMBOLS);
}

/*
  Loads sector ETF performance for XLK, XLF, XLE, etc.
*/
async function loadSectorData(): Promise<MarketIndex[]> {
  return fetchFMPQuotes(SECTOR_SYMBOLS);
}

/*
  Returns a full MarketSnapshot object consumed by Sentinel.
*/
export async function get_market_snapshot(): Promise<MarketSnapshot> {
  const indices = await loadIndexData();
  const sectors = await loadSectorData();

  return {
    indices,
    sectors,
    timestamp: new Date().toISOString(),
  };
}
