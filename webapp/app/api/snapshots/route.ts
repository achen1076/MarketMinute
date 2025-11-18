import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSnapshotsForSymbols } from "@/lib/marketData";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const watchlistId = searchParams.get("watchlistId");

  if (!watchlistId) {
    return NextResponse.json({ error: "watchlistId required" }, { status: 400 });
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: { items: true },
  });

  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  const symbols = watchlist.items.map((i) => i.symbol);
  const snapshots = symbols.length > 0 ? await getSnapshotsForSymbols(symbols) : [];

  return NextResponse.json({ snapshots });
}
