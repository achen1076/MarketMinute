import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
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
    const predictions = await prisma.livePrediction.findMany({
      where: { runId: latestRun.runId },
      orderBy: { ticker: "asc" },
    });

    // Transform to match expected format
    const formatted = predictions.map((p) => ({
      ticker: p.ticker,
      timestamp: p.timestamp.toISOString(),
      current_price: p.currentPrice,
      signal: p.signal,
      confidence: p.confidence,
      prob_up: p.probUp,
      prob_neutral: p.probNeutral,
      prob_down: p.probDown,
      should_trade: p.shouldTrade,
      take_profit: p.takeProfit,
      stop_loss: p.stopLoss,
      atr: p.atr,
    }));

    return NextResponse.json({
      predictions: formatted,
      timestamp: latestRun.timestamp.toISOString(),
      runId: latestRun.runId,
    });
  } catch (error) {
    console.error("Failed to load quant predictions:", error);
    return NextResponse.json(
      { error: "Failed to load predictions", predictions: [] },
      { status: 500 }
    );
  }
}
