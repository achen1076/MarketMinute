import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSnapshotsForSymbols } from "@shared/lib/marketData";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const watchlistId = searchParams.get("watchlistId");

  if (!watchlistId) {
    return NextResponse.json({ snapshots: [] });
  }

  const watchlist = await prisma.watchlist.findFirst({
    where: {
      id: watchlistId,
      user: { email: session.user.email },
    },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!watchlist) {
    return new NextResponse("Watchlist not found", { status: 404 });
  }

  const symbols = watchlist.items.map((item) => item.symbol);

  if (symbols.length === 0) {
    return NextResponse.json({ snapshots: [] });
  }

  const snapshots = await getSnapshotsForSymbols(symbols);

  const enrichedSnapshots = snapshots.map((snapshot) => {
    const item = watchlist.items.find((i) => i.symbol === snapshot.symbol);
    return {
      ...snapshot,
      isFavorite: item?.isFavorite ?? false,
      itemId: item?.id ?? null,
    };
  });

  return NextResponse.json({ snapshots: enrichedSnapshots });
}
