import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { watchlistId } = body as { watchlistId: string | null };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // Update user's active watchlist
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { activeWatchlistId: watchlistId },
  });

  return NextResponse.json({ activeWatchlistId: updated.activeWatchlistId });
}
