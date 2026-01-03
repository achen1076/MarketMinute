import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCachedSnapshots } from "@/lib/tickerCache";
import { buildSummary } from "@/lib/summary";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rateLimit";
import { trackUsage } from "@/lib/usage-tracking";
import { redis } from "@/lib/redis";
import { getCachedUser } from "@/lib/request-cache";

const WATCHLIST_CACHE_TTL = 31536000; // 1 year (invalidated on mutation)

type CachedWatchlistData = {
  name: string;
  userId: string;
  items: { symbol: string; isFavorite: boolean }[];
};

async function getCachedWatchlist(
  watchlistId: string
): Promise<CachedWatchlistData | null> {
  if (!redis) return null;
  try {
    return await redis.get<CachedWatchlistData>(
      `watchlist:${watchlistId}:data`
    );
  } catch {
    return null;
  }
}

async function setCachedWatchlist(
  watchlistId: string,
  data: CachedWatchlistData
): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(
      `watchlist:${watchlistId}:data`,
      WATCHLIST_CACHE_TTL,
      data
    );
  } catch (error) {
    console.error("[WatchlistCache] Failed to cache:", error);
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Rate limiting: 15 requests per minute per user
  const rateLimitResult = checkRateLimit(
    "summary",
    session.user.email,
    RateLimitPresets.AI_SUMMARY
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  const user = await getCachedUser(session.user.email);

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const watchlistId = searchParams.get("watchlistId");

  if (!watchlistId) {
    return new NextResponse("Missing watchlistId", { status: 400 });
  }

  // Try cache first
  let watchlistData = await getCachedWatchlist(watchlistId);

  if (!watchlistData) {
    const watchlist = await prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: { items: true },
    });

    if (!watchlist) {
      return new NextResponse("Watchlist not found", { status: 404 });
    }

    watchlistData = {
      name: watchlist.name,
      userId: watchlist.userId,
      items: watchlist.items.map((i) => ({
        symbol: i.symbol,
        isFavorite: (i as any).isFavorite ?? false,
      })),
    };

    setCachedWatchlist(watchlistId, watchlistData);
  }

  if (watchlistData.userId !== user.id) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  if (watchlistData.items.length === 0) {
    return NextResponse.json({
      headline: "No symbols in this watchlist yet.",
      body: "Add some tickers to start getting a daily MarketMinute.",
      stats: {
        listName: watchlistData.name,
        totalSymbols: 0,
        upCount: 0,
        downCount: 0,
        best: null,
        worst: null,
      },
      tickerPerformance: [],
    });
  }

  // Track usage
  trackUsage(user.id, "summary", { watchlistId }).catch(console.error);

  const symbols = watchlistData.items.map((i) => i.symbol);
  const favoritedSymbols = watchlistData.items
    .filter((i) => i.isFavorite)
    .map((i) => i.symbol);
  const { snapshots, cacheStats } = await getCachedSnapshots(symbols);
  const summary = await buildSummary(
    watchlistData.name,
    snapshots,
    favoritedSymbols
  );

  return NextResponse.json(summary, {
    headers: {
      ...getRateLimitHeaders(rateLimitResult),
      "X-Cache-Hits": String(cacheStats.hits),
      "X-Cache-Misses": String(cacheStats.misses),
    },
  });
}
