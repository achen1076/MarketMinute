import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

  // Add new items
  await prisma.watchlistItem.createMany({
    data: newSymbols.map((symbol) => ({
      watchlistId,
      symbol,
    })),
  });

  // Return updated watchlist
  const updated = await prisma.watchlist.findUnique({
    where: { id: watchlistId },
    include: { items: true },
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

  return new NextResponse(null, { status: 204 });
}
