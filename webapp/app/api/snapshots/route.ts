import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCachedSnapshots } from "@/lib/tickerCache";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
} from "@/lib/rateLimit";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const watchlistId = searchParams.get("watchlistId");

  if (!watchlistId) {
    return NextResponse.json(
      { error: "watchlistId required" },
      { status: 400 }
    );
  }

  // Rate limiting: 30 snapshot requests per minute per user
  const rateLimitResult = checkRateLimit(
    "snapshots",
    session.user.email,
    RateLimitPresets.DATA_FETCH
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: { items: true },
  });

  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  const symbols = watchlist.items.map((i) => i.symbol);

  if (symbols.length === 0) {
    return NextResponse.json({ snapshots: [] });
  }

  const { snapshots, cacheStats } = await getCachedSnapshots(symbols);

  // Enrich snapshots with favorite status and item IDs
  const enrichedSnapshots = snapshots.map((snapshot) => {
    const item = watchlist.items.find(
      (i) => i.symbol.toUpperCase() === snapshot.symbol.toUpperCase()
    );
    return {
      ...snapshot,
      isFavorite: (item as any)?.isFavorite ?? false,
      itemId: item?.id ?? null,
    };
  });

  return NextResponse.json(
    { snapshots: enrichedSnapshots },
    {
      headers: {
        "X-Cache-Hits": String(cacheStats.hits),
        "X-Cache-Misses": String(cacheStats.misses),
        "X-Watchlist-Size": String(symbols.length),
      },
    }
  );
}
