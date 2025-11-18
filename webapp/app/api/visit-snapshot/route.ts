import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSnapshotsForSymbols } from "@/lib/marketData";

/**
 * Create a snapshot of current watchlist state
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { watchlistId } = body;

    if (!watchlistId) {
      return NextResponse.json(
        { error: "watchlistId required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const watchlist = await prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: { items: true },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    const symbols = watchlist.items.map((i) => i.symbol);
    const snapshots = await getSnapshotsForSymbols(symbols);

    const avgChangePct =
      snapshots.length > 0
        ? snapshots.reduce((sum, s) => sum + s.changePct, 0) / snapshots.length
        : 0;

    const snapshotData = {
      symbols: snapshots.map((s) => ({
        symbol: s.symbol,
        price: s.price,
        changePct: s.changePct,
      })),
      avgChangePct,
      timestamp: Date.now(),
    };

    await prisma.userVisitSnapshot.create({
      data: {
        userId: user.id,
        watchlistId,
        data: JSON.stringify(snapshotData),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VisitSnapshot] Error creating snapshot:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}

/**
 * Get the last visit snapshot and compare with current state
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const watchlistId = searchParams.get("watchlistId");

    if (!watchlistId) {
      return NextResponse.json(
        { error: "watchlistId required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get last snapshot
    const lastSnapshot = await prisma.userVisitSnapshot.findFirst({
      where: {
        userId: user.id,
        watchlistId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastSnapshot) {
      return NextResponse.json({ hasSnapshot: false });
    }

    // Get current state
    const watchlist = await prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: { items: true },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    const symbols = watchlist.items.map((i) => i.symbol);
    const currentSnapshots = await getSnapshotsForSymbols(symbols);

    const lastData = JSON.parse(lastSnapshot.data) as {
      symbols: Array<{ symbol: string; price: number; changePct: number }>;
      avgChangePct: number;
      timestamp: number;
    };

    // Calculate changes since last visit
    const changes = currentSnapshots
      .map((current) => {
        const last = lastData.symbols.find((s) => s.symbol === current.symbol);
        if (!last) return null;

        const priceChange = current.price - last.price;
        const priceChangePct = (priceChange / last.price) * 100;

        return {
          symbol: current.symbol,
          lastPrice: last.price,
          currentPrice: current.price,
          priceChange,
          priceChangePct,
        };
      })
      .filter((c) => c !== null);

    const avgPriceChangePct =
      changes.length > 0
        ? changes.reduce((sum, c) => sum + c!.priceChangePct, 0) /
          changes.length
        : 0;

    // Find biggest movers
    const sortedChanges = [...changes].sort(
      (a, b) => Math.abs(b!.priceChangePct) - Math.abs(a!.priceChangePct)
    );

    return NextResponse.json({
      hasSnapshot: true,
      lastVisit: lastSnapshot.createdAt,
      avgPriceChangePct,
      topMovers: sortedChanges.slice(0, 3),
      allChanges: changes,
    });
  } catch (error) {
    console.error("[VisitSnapshot] Error comparing snapshots:", error);
    return NextResponse.json(
      { error: "Failed to compare snapshots" },
      { status: 500 }
    );
  }
}
