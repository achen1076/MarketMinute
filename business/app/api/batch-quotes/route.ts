import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSnapshotsForSymbols } from "@shared/lib/marketData";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ quotes: [] });
  }

  const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase());
  const snapshots = await getSnapshotsForSymbols(symbolList);

  const quotes = snapshots.map((s) => ({
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    changePct: s.changePct,
  }));

  return NextResponse.json({ quotes });
}
