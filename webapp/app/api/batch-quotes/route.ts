import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCachedSnapshots } from "@shared/lib/tickerCache";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ quotes: [] });
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  try {
    const { snapshots } = await getCachedSnapshots(symbols);

    const quotes = snapshots.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      changePct: s.changePct,
      changePercentage: s.changePct,
      volume: s.volume,
      marketCap: s.marketCap,
    }));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("[BatchQuotes] Error:", error);
    return NextResponse.json({ quotes: [], error: "Failed to fetch quotes" });
  }
}
