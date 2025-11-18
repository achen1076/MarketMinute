import { NextResponse } from "next/server";
import { getSnapshotsForSymbols } from "@/lib/marketData";

const TICKER_SYMBOLS = [
  { symbol: "$SPX", name: "S&P 500" },
  { symbol: "$DJI", name: "Dow" },
  { symbol: "$COMPX", name: "Nasdaq" },
  { symbol: "TQQQ", name: "TQQQ" },
  { symbol: "SQQQ", name: "SQQQ" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
];

export async function GET() {
  try {
    const symbols = TICKER_SYMBOLS.map((t) => t.symbol);
    const snapshots = await getSnapshotsForSymbols(symbols);

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

    return NextResponse.json({ tickers });
  } catch (error) {
    console.error("Failed to fetch market ticker data:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
