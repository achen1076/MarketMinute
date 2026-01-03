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

  // Track usage
  trackUsage(user.id, "summary", { watchlistId }).catch(console.error);

  const symbols = watchlist.items.map((i) => i.symbol);
  const favoritedSymbols = watchlist.items
    .filter((i) => (i as any).isFavorite)
    .map((i) => i.symbol);
  const { snapshots, cacheStats } = await getCachedSnapshots(symbols);
  const summary = await buildSummary(
    watchlist.name,
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
