import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCachedSnapshots } from "@/lib/tickerCache";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
} from "@/lib/rateLimit";
import { redis } from "@/lib/redis";
import {
  getCachedWatchlistSymbols,
  setCachedWatchlistSymbols,
} from "@/lib/request-cache";

const WATCHLIST_CACHE_TTL = 31536000;

type CachedWatchlistItem = {
  id: string;
  symbol: string;
  isFavorite: boolean;
};

async function getCachedWatchlistItems(
  watchlistId: string
): Promise<CachedWatchlistItem[] | null> {
  if (!redis) return null;
  try {
    const cacheKey = `watchlist:${watchlistId}:items`;
    return await redis.get<CachedWatchlistItem[]>(cacheKey);
  } catch {
    return null;
  }
}

async function setCachedWatchlistItems(
  watchlistId: string,
  items: CachedWatchlistItem[]
): Promise<void> {
  if (!redis) return;
  try {
    const cacheKey = `watchlist:${watchlistId}:items`;
    await redis.setex(cacheKey, WATCHLIST_CACHE_TTL, items);
  } catch (error) {
    console.error("[WatchlistCache] Failed to cache:", error);
  }
}

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

  const rateLimitResult = checkRateLimit(
    "snapshots",
    session.user.email,
    RateLimitPresets.DATA_FETCH
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  // Try to get watchlist items from cache first
  let watchlistItems = await getCachedWatchlistItems(watchlistId);
  let cacheHit = !!watchlistItems;

  if (!watchlistItems) {
    // Cache miss - fetch from database
    const watchlist = await prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: { items: true },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    watchlistItems = watchlist.items.map((i) => ({
      id: i.id,
      symbol: i.symbol,
      isFavorite: (i as any).isFavorite ?? false,
    }));

    // Cache for next time
    setCachedWatchlistItems(watchlistId, watchlistItems);

    // Also cache symbols list for other endpoints
    setCachedWatchlistSymbols(
      watchlistId,
      watchlistItems.map((i) => i.symbol)
    );
  }

  const symbols = watchlistItems.map((i) => i.symbol);

  if (symbols.length === 0) {
    return NextResponse.json({ snapshots: [] });
  }

  const { snapshots, cacheStats } = await getCachedSnapshots(symbols);

  const enrichedSnapshots = snapshots.map((snapshot) => {
    const item = watchlistItems!.find(
      (i) => i.symbol.toUpperCase() === snapshot.symbol.toUpperCase()
    );
    return {
      ...snapshot,
      isFavorite: item?.isFavorite ?? false,
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
