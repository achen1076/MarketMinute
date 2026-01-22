import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { watchlistId, isFavorite } = body as {
    watchlistId: string;
    isFavorite: boolean;
  };

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

  const updated = await prisma.watchlist.update({
    where: { id: watchlistId },
    data: { isFavorite },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json(updated);
}
