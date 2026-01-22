import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { itemId, isFavorite } = body as {
    itemId: string;
    isFavorite: boolean;
  };

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

  const updated = await prisma.watchlistItem.update({
    where: { id: itemId },
    data: { isFavorite },
  });

  return NextResponse.json(updated);
}
