import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      watchlists: {
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  return NextResponse.json(user?.watchlists ?? []);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { name, symbols } = body as { name: string; symbols: string[] };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const watchlist = await prisma.watchlist.create({
    data: {
      name,
      userId: user.id,
      items: {
        create: symbols.map((symbol, index) => ({ symbol, order: index })),
      },
    },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  const watchlistCount = await prisma.watchlist.count({
    where: { userId: user.id },
  });

  if (watchlistCount === 1) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWatchlistId: watchlist.id },
    });
  }

  return NextResponse.json(watchlist, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { watchlistId, name } = body as {
    watchlistId: string;
    name: string;
  };

  if (!watchlistId || !name?.trim()) {
    return new NextResponse("Watchlist ID and name required", { status: 400 });
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

  const updated = await prisma.watchlist.update({
    where: { id: watchlistId },
    data: { name: name.trim() },
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
  const watchlistId = searchParams.get("id");

  if (!watchlistId) {
    return new NextResponse("Watchlist ID required", { status: 400 });
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

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      watchlists: {
        orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  const isActiveWatchlist = user?.activeWatchlistId === watchlistId;

  await prisma.watchlist.delete({
    where: { id: watchlistId },
  });

  if (isActiveWatchlist && user) {
    const remainingWatchlists = user.watchlists.filter(
      (w: { id: string }) => w.id !== watchlistId
    );
    const newActiveId =
      remainingWatchlists.length > 0 ? remainingWatchlists[0].id : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { activeWatchlistId: newActiveId },
    });
  }

  return new NextResponse(null, { status: 204 });
}
