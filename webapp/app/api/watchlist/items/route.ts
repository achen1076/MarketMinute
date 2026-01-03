import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkLimit, SubscriptionTier } from "@/lib/subscription-tiers";
import { invalidateWatchlistCaches } from "@/lib/request-cache";

// Add items to watchlist
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { watchlistId, symbols } = body as {
    watchlistId: string;
    symbols: string[];
  };

  if (!watchlistId || !symbols || symbols.length === 0) {
    return new NextResponse("Watchlist ID and symbols required", {
      status: 400,
    });
  }

  // Get user with subscription tier
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { subscriptionTier: true },
  });

  const tier = (user?.subscriptionTier || "free") as SubscriptionTier;

  // Verify user owns the watchlist
  const watchlist = await prisma.watchlist.findFirst({
    where: {
      id: watchlistId,
      user: { email: session.user.email },
    },
    include: { items: true },
  });

  if (!watchlist) {
    return new NextResponse("Watchlist not found", { status: 404 });
  }

  // Get existing symbols to avoid duplicates
  const existingSymbols = watchlist.items.map((item) => item.symbol);
  const newSymbols = symbols.filter(
    (symbol) => !existingSymbols.includes(symbol)
  );

  if (newSymbols.length === 0) {
    return NextResponse.json(watchlist);
  }

  // Check watchlist items limit
  const currentCount = watchlist.items.length;
  const limitCheck = checkLimit(tier, "watchlistItems", currentCount);

  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message, limit: limitCheck.limit },
      { status: 403 }
    );
  }

  // Cap new symbols to stay within limit
  const remainingSlots =
    limitCheck.limit === "unlimited"
      ? newSymbols.length
      : limitCheck.limit - currentCount;
  const symbolsToAdd = newSymbols.slice(0, remainingSlots);

  // Get the max order value to append new items
  const maxOrder = watchlist.items.reduce(
    (max, item) => Math.max(max, item.order || 0),
    -1
  );

  // Add new items with proper ordering
  await prisma.watchlistItem.createMany({
    data: symbolsToAdd.map((symbol, index) => ({
      watchlistId,
      symbol,
      order: maxOrder + index + 1,
    })),
  });

  // Invalidate cache
  await invalidateWatchlistCaches(watchlistId);

  // Return updated watchlist
  const updated = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json(updated);
}

// Remove item from watchlist
export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("id");

  if (!itemId) {
    return new NextResponse("Item ID required", { status: 400 });
  }

  // Verify user owns the watchlist that contains this item
  const item = await prisma.watchlistItem.findFirst({
    where: {
      id: itemId,
      watchlist: {
        user: { email: session.user.email },
      },
    },
  });

  if (!item) {
    return new NextResponse("Item not found", { status: 404 });
  }

  await prisma.watchlistItem.delete({
    where: { id: itemId },
  });

  // Invalidate cache
  await invalidateWatchlistCaches(item.watchlistId);

  return new NextResponse(null, { status: 204 });
}

// Update item order
export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { watchlistId, itemOrders } = body as {
    watchlistId: string;
    itemOrders: { id: string; order: number }[];
  };

  if (!watchlistId || !itemOrders || itemOrders.length === 0) {
    return new NextResponse("Watchlist ID and item orders required", {
      status: 400,
    });
  }

  // Verify user owns the watchlist
  const watchlist = await prisma.watchlist.findFirst({
    where: {
      id: watchlistId,
      user: { email: session.user.email },
    },
  });

  if (!watchlist) {
    return new NextResponse("Watchlist not found", { status: 404 });
  }

  // Update all item orders in a transaction
  await prisma.$transaction(
    itemOrders.map(({ id, order }) =>
      prisma.watchlistItem.update({
        where: { id },
        data: { order },
      })
    )
  );

  // Return updated watchlist
  const updated = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json(updated);
}
