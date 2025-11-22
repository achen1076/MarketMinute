import { MarketSnapshot, MarketIndex } from "../../agent/types";
import { getSchwabAccessToken } from "../schwab/auth";

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
  Fetch quotes from Schwab for multiple symbols at once.
*/
async function fetchSchwabQuotes(symbols: string[]): Promise<MarketIndex[]> {
  const accessToken = await getSchwabAccessToken();

  // Correct Schwab API endpoint
  const url = new URL("https://api.schwabapi.com/marketdata/v1/quotes");
  url.searchParams.set("symbols", symbols.join(","));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Sentinel] Schwab API error ${res.status}:`, text);
    throw new Error(`Schwab API failed: ${res.status}`);
  }

  const data = (await res.json()) as Record<string, any>;

  // Parse response structure: { "SPY": { quote: {...}, regular: {...} }, ... }
  return symbols.map((symbol) => {
    const key = symbol.toUpperCase();
    const item = data[key] || {};
    const quote = item.quote || {};
    const regular = item.regular || {};

    const price =
      regular.regularMarketLastPrice ?? quote.lastPrice ?? quote.mark ?? null;

    const changePct =
      regular.regularMarketPercentChange ??
      quote.netPercentChange ??
      quote.markPercentChange ??
      0;

    return {
      symbol: key,
      changePct: Number(changePct) || 0,
      price: price ? Number(price) : null,
    };
  });
}

/*
  Loads index performance for SPY, QQQ, IWM, DIA.
*/
async function loadIndexData(): Promise<MarketIndex[]> {
  return fetchSchwabQuotes(INDEX_SYMBOLS);
}

/*
  Loads sector ETF performance for XLK, XLF, XLE, etc.
*/
async function loadSectorData(): Promise<MarketIndex[]> {
  return fetchSchwabQuotes(SECTOR_SYMBOLS);
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
