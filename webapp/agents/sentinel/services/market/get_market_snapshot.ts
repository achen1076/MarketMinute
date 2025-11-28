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
  Fetch quotes from FMP using batch-quote endpoint (premium tier).
*/
async function fetchFMPQuotes(symbols: string[]): Promise<MarketIndex[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[Sentinel] FMP API key not configured");
    throw new Error("FMP API key not configured");
  }

  try {
    const symbolsParam = symbols.join(",");
    const url = new URL("https://financialmodelingprep.com/stable/batch-quote");
    url.searchParams.set("symbols", symbolsParam);
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url.toString());

    if (!res.ok) {
      console.error(`[Sentinel] FMP batch quote error:`, res.status);
      return symbols.map((symbol) => ({
        symbol: symbol.toUpperCase(),
        changePct: 0,
        price: null,
      }));
    }

    const data = (await res.json()) as any[];

    if (!Array.isArray(data)) {
      console.error("[Sentinel] Invalid batch quote response:", data);
      return symbols.map((symbol) => ({
        symbol: symbol.toUpperCase(),
        changePct: 0,
        price: null,
      }));
    }

    const results = data.map((quote: any) => {
      const key = quote.symbol.toUpperCase();
      const price = quote.price ?? null;
      const changePct = quote.changePercentage ?? 0;

      return {
        symbol: key,
        changePct: Number(changePct) || 0,
        price: price ? Number(price) : null,
      };
    });

    return results;
  } catch (error) {
    console.error(`[Sentinel] Error fetching batch quotes:`, error);
    return symbols.map((symbol) => ({
      symbol: symbol.toUpperCase(),
      changePct: 0,
      price: null,
    }));
  }
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
