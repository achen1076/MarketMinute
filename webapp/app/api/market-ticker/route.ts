import { NextResponse } from "next/server";
import { getCachedSnapshots } from "@/lib/tickerCache";
import { getTickerCacheTTL } from "@/lib/marketHours";

const TICKER_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
  { symbol: "XOM", name: "Exxon" },
  { symbol: "LLY", name: "Eli Lilly" },
  { symbol: "COST", name: "Costco" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "AVGO", name: "Broadcom" },
  { symbol: "BRK.B", name: "Berkshire Hathaway" },
  { symbol: "TSMC", name: "TSMC" },
];

export async function GET() {

  try {
    const symbols = TICKER_SYMBOLS.map((t) => t.symbol);
    const { snapshots, cacheStats } = await getCachedSnapshots(symbols);

    const tickers = snapshots.map((snapshot) => {
      const tickerInfo = TICKER_SYMBOLS.find(
        (t) => t.symbol === snapshot.symbol
      );
      return {
        symbol: snapshot.symbol,
        name: tickerInfo?.name || snapshot.symbol,
        price: snapshot.price,
        changePct: snapshot.changePct,
      };
    });

    const cacheTTL = getTickerCacheTTL(2);
    const lastUpdated = new Date().toISOString();

    return NextResponse.json(
      { tickers, lastUpdated },
      {
        headers: {
          "X-Cache-Hits": String(cacheStats.hits),
          "X-Cache-Misses": String(cacheStats.misses),
          "Cache-Control": `public, max-age=${cacheTTL}`,
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch market ticker data:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
