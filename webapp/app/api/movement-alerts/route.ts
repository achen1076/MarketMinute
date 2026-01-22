// app/api/movement-alerts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCachedSnapshots } from "@shared/lib/tickerCache";
import { computeMovementAlerts } from "@shared/lib/movementAlerts";

/**
 * Get movement alerts summary for all symbols in the watchlist
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get("symbols");

    if (!symbolsParam) {
      return NextResponse.json(
        { error: "symbols parameter required" },
        { status: 400 }
      );
    }

    const symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    // Batch fetch all ticker data in one call
    const { snapshots } = await getCachedSnapshots(symbols);

    let bigMovers = 0;
    let nearHighs = 0;
    let nearLows = 0;
    let earningsSoon = 0;

    const details = [];

    // Process alerts (synchronous computation, no database calls)
    for (const snapshot of snapshots) {
      const alertFlags = computeMovementAlerts(
        snapshot.symbol,
        snapshot.changePct,
        snapshot.price,
        snapshot.high52w,
        snapshot.low52w,
        snapshot.earningsDate
      );

      if (alertFlags.alerts.length > 0) {
        details.push({
          symbol: snapshot.symbol,
          alerts: alertFlags.alerts,
        });
      }

      if (alertFlags.hit_3pct_today) bigMovers++;
      if (alertFlags.within_2pct_52w_high) nearHighs++;
      if (alertFlags.within_2pct_52w_low) nearLows++;
      if (alertFlags.earnings_within_5_days) earningsSoon++;
    }

    return NextResponse.json({
      bigMovers,
      nearHighs,
      nearLows,
      earningsSoon,
      details,
    });
  } catch (error) {
    console.error("[MovementAlerts] Error computing alerts:", error);
    return NextResponse.json(
      { error: "Failed to compute alerts" },
      { status: 500 }
    );
  }
}
