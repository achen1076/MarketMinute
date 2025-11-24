import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get the most recent run of forecasts
    const latestRun = await prisma.distribionalForecast.findFirst({
      orderBy: { createdAt: "desc" },
      select: { runId: true, timestamp: true },
    });

    if (!latestRun) {
      return NextResponse.json({
        forecasts: [],
        message:
          "No forecasts available yet. Run the cron job to generate forecasts.",
      });
    }

    // Get all forecasts from that run
    const forecasts = await prisma.distribionalForecast.findMany({
      where: { runId: latestRun.runId },
      orderBy: { ticker: "asc" },
    });

    // Transform to match expected format
    const formatted = forecasts.map((f) => ({
      ticker: f.ticker,
      timestamp: f.timestamp.toISOString(),
      current_price: f.currentPrice,
      expected_range_pct: f.expectedRangePct,
      upper_bound: f.upperBound,
      lower_bound: f.lowerBound,
      directional_bias: f.directionalBias,
      conviction: f.conviction,
      conviction_score: f.convictionScore,
      most_likely_category: f.mostLikelyCategory,
      prob_large_up: f.probLargeUp,
      prob_mild_up: f.probMildUp,
      prob_flat: f.probFlat,
      prob_mild_down: f.probMildDown,
      prob_large_down: f.probLargeDown,
      p10: f.p10,
      p50: f.p50,
      p90: f.p90,
    }));

    return NextResponse.json({
      forecasts: formatted,
      timestamp: latestRun.timestamp.toISOString(),
      runId: latestRun.runId,
    });
  } catch (error) {
    console.error("Failed to load distributional forecasts:", error);
    return NextResponse.json(
      { error: "Failed to load forecasts", forecasts: [] },
      { status: 500 }
    );
  }
}
