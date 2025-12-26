import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const watchlistId = searchParams.get("watchlistId");

    if (!watchlistId) {
      return NextResponse.json({ alerts: [] });
    }

    // Verify user owns this watchlist
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        user: { email: session.user.email },
      },
      include: {
        items: { select: { symbol: true } },
      },
    });

    if (!watchlist) {
      return new NextResponse("Watchlist not found", { status: 404 });
    }

    const symbols = watchlist.items.map((item) => item.symbol.toUpperCase());

    if (symbols.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    // Get active (non-expired) ticker alerts for these symbols
    const now = new Date();
    const alerts = await prisma.tickerAlert.findMany({
      where: {
        symbol: { in: symbols },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("[Alerts] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
