import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSnapshotsForSymbols } from "@/lib/marketData";
import { buildSummary } from "@/lib/summary";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const watchlistId = searchParams.get("watchlistId");

  if (!watchlistId) {
    return new NextResponse("Missing watchlistId", { status: 400 });
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: { items: true },
  });

  if (!watchlist) {
    return new NextResponse("Watchlist not found", { status: 404 });
  }

  if (watchlist.userId !== user.id) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  if (watchlist.items.length === 0) {
    return NextResponse.json({
      headline: "No symbols in this watchlist yet.",
      body: "Add some tickers to start getting a daily MarketMinute.",
      stats: {
        listName: watchlist.name,
        totalSymbols: 0,
        upCount: 0,
        downCount: 0,
        best: null,
        worst: null,
      },
      tickerPerformance: [],
    });
  }

  const symbols = watchlist.items.map((i) => i.symbol);
  const snapshots = await getSnapshotsForSymbols(symbols);
  const summary = await buildSummary(watchlist.name, snapshots);

  return NextResponse.json(summary);
}
