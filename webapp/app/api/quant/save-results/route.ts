import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // No auth required - this is an internal service endpoint called by Lambda
  try {
    const body = await request.json();
    const { live_predictions, distributional_forecasts, timestamp } = body;

    if (!live_predictions || !distributional_forecasts) {
      return NextResponse.json(
        { ok: false, error: "Missing predictions or forecasts" },
        { status: 400 }
      );
    }

    const runId = `run_${Date.now()}`;

    // Save predictions
    const predictions = await prisma.livePrediction.createMany({
      data: live_predictions.map((p: any) => ({
        ticker: p.ticker,
        timestamp: new Date(p.timestamp),
        currentPrice: p.current_price,
        // Raw model outputs (before news adjustment)
        rawSignal: p.raw_signal || null,
        rawConfidence: p.raw_confidence || null,
        rawProbUp: p.raw_prob_up || null,
        rawProbNeutral: p.raw_prob_neutral || null,
        rawProbDown: p.raw_prob_down || null,
        // News-adjusted outputs (after Bayesian update)
        signal: p.signal,
        confidence: p.confidence,
        probUp: p.prob_up,
        probNeutral: p.prob_neutral,
        probDown: p.prob_down,
        newsCount: p.news_count || null,
        shouldTrade: p.should_trade,
        takeProfit: p.take_profit || null,
        stopLoss: p.stop_loss || null,
        atr: p.atr || null,
        runId,
      })),
    });

    // Save forecasts
    const forecasts = await prisma.distribionalForecast.createMany({
      data: distributional_forecasts.map((f: any) => ({
        ticker: f.ticker,
        timestamp: new Date(f.timestamp),
        currentPrice: f.current_price,
        expectedRangePct: f.expected_range_pct,
        upperBound: f.upper_bound,
        lowerBound: f.lower_bound,
        directionalBias: f.directional_bias,
        conviction: f.conviction,
        convictionScore: f.conviction_score,
        mostLikelyCategory: f.most_likely_category,
        probLargeUp: f.prob_large_up,
        probMildUp: f.prob_mild_up,
        probFlat: f.prob_flat,
        probMildDown: f.prob_mild_down,
        probLargeDown: f.prob_large_down,
        p10: f.p10,
        p50: f.p50,
        p90: f.p90,
        runId,
      })),
    });

    console.log(
      `[SaveResults] Saved ${predictions.count} predictions and ${forecasts.count} forecasts`
    );

    return NextResponse.json({
      ok: true,
      saved: {
        predictions: predictions.count,
        forecasts: forecasts.count,
        runId,
      },
    });
  } catch (error) {
    console.error("[SaveResults] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to save results" },
      { status: 500 }
    );
  }
}
