import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

  if (!watchlistId || !symbols?.length) {
    return new NextResponse("Watchlist ID and symbols required", {
      status: 400,
    });
  }

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

  const existingSymbols = new Set(watchlist.items.map((i) => i.symbol));
  const newSymbols = symbols.filter((s) => !existingSymbols.has(s));
  const startOrder = watchlist.items.length;

  await prisma.watchlistItem.createMany({
    data: newSymbols.map((symbol, index) => ({
      watchlistId,
      symbol,
      order: startOrder + index,
    })),
  });

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

  if (!watchlistId || !itemOrders?.length) {
    return new NextResponse("Watchlist ID and item orders required", {
      status: 400,
    });
  }

  const watchlist = await prisma.watchlist.findFirst({
    where: {
      id: watchlistId,
      user: { email: session.user.email },
    },
  });

  if (!watchlist) {
    return new NextResponse("Watchlist not found", { status: 404 });
  }

  await prisma.$transaction(
    itemOrders.map(({ id, order }) =>
      prisma.watchlistItem.update({
        where: { id },
        data: { order },
      })
    )
  );

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
