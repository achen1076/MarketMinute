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

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ quotes: [] });
  }

  try {
    const url = new URL("https://financialmodelingprep.com/stable/search");
    url.searchParams.set("query", query);
    url.searchParams.set("limit", "10");
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ quotes: [] });
    }

    const data = await res.json();

    const quotes = (Array.isArray(data) ? data : [])
      .filter(
        (item: any) =>
          item.exchangeShortName === "NASDAQ" ||
          item.exchangeShortName === "NYSE"
      )
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchangeShortName,
      }));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("[Ticker Search] Error:", error);
    return NextResponse.json({ quotes: [] });
  }
}
