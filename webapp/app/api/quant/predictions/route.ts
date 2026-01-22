import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@shared/lib/usage-tracking";
import { getTierConfig } from "@shared/lib/subscription-tiers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get user and tier info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        activeWatchlistId: true,
        watchlists: {
          include: {
            items: {
              select: { symbol: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const tier = await getUserTier(user.id);
    const tierConfig = getTierConfig(tier);

    // Get user's watchlist symbols
    const activeWatchlist = user.watchlists.find(
      (w) => w.id === user.activeWatchlistId
    );
    const watchlistSymbols = activeWatchlist
      ? activeWatchlist.items.map((item) => item.symbol)
      : [];

    // Get the most recent run of predictions
    const latestRun = await prisma.livePrediction.findFirst({
      orderBy: { createdAt: "desc" },
      select: { runId: true, timestamp: true },
    });

    if (!latestRun) {
      return NextResponse.json({
        predictions: [],
        message:
          "No predictions available yet. Run the cron job to generate predictions.",
      });
    }

    // Get all predictions from that run
    let predictions = await prisma.livePrediction.findMany({
      where: { runId: latestRun.runId },
      orderBy: [
        { confidence: "desc" }, // Top signals first
        { ticker: "asc" },
      ],
    });

    // No server-side filtering - client handles view-specific filtering
    // API returns all predictions, tier info, and watchlist symbols

    // Transform to match expected format
    const formatted = predictions.map((p) => ({
      ticker: p.ticker,
      timestamp: p.timestamp.toISOString(),
      current_price: p.currentPrice,
      raw_signal: p.rawSignal,
      raw_confidence: p.rawConfidence,
      raw_prob_up: p.rawProbUp,
      raw_prob_neutral: p.rawProbNeutral,
      raw_prob_down: p.rawProbDown,
      signal: p.signal,
      confidence: p.confidence,
      prob_up: p.probUp,
      prob_neutral: p.probNeutral,
      prob_down: p.probDown,
      news_count: p.newsCount,
      should_trade: p.shouldTrade,
      take_profit: p.takeProfit,
      stop_loss: p.stopLoss,
      atr: p.atr,
    }));

    return NextResponse.json({
      predictions: formatted,
      timestamp: latestRun.timestamp.toISOString(),
      runId: latestRun.runId,
      tier,
      watchlistSymbols,
    });
  } catch (error) {
    console.error("Failed to load quant predictions:", error);
    return NextResponse.json(
      { error: "Failed to load predictions", predictions: [] },
      { status: 500 }
    );
  }
}
