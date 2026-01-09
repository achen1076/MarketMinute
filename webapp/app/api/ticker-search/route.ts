import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ quotes: [] });
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        query
      )}&quotesCount=10&newsCount=0`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch from Yahoo Finance");
    }

    const data = await res.json();

    // Filter and format the results
    const quotes = (data.quotes || [])
      .filter(
        (q: any) =>
          (q.quoteType === "EQUITY" || q.quoteType === "ETF") &&
          q.exchange &&
          !q.symbol.includes(".") &&
          q.symbol
      )
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange,
        score: q.score || 0,
        isYahooFinance: q.isYahooFinance || false,
      }))
      .sort((a: any, b: any) => {
        if (a.isYahooFinance && !b.isYahooFinance) return -1;
        if (!a.isYahooFinance && b.isYahooFinance) return 1;

        if (b.score !== a.score) return b.score - a.score;

        const majorExchanges = ["NMS", "NYQ", "NGM", "PCX"];
        const aIsMajor = majorExchanges.includes(a.exchange);
        const bIsMajor = majorExchanges.includes(b.exchange);
        if (aIsMajor && !bIsMajor) return -1;
        if (!aIsMajor && bIsMajor) return 1;

        return 0;
      })
      .slice(0, 10);

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Ticker search error:", error);
    return NextResponse.json(
      { quotes: [], error: "Search failed" },
      { status: 500 }
    );
  }
}
