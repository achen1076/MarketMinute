import {
  GetQuantSignalsInputSchema,
  GetQuantSignalsOutputSchema,
  GetQuantSignalsToolSpec,
  type GetQuantSignalsInput,
  type GetQuantSignalsOutput,
} from "@/shared/schemas/tools/getQuantSignals.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

function calculateQuantScore(
  probUp: number,
  probDown: number,
  probNeutral: number,
  confidence: number
): number {
  const edge = Math.abs(probUp - probDown);
  const trendFactor = 1 - probNeutral;
  const directionStrength = Math.max(probUp, probDown);

  const EDGE_WEIGHT = 70;
  const TREND_WEIGHT = 40;
  const DIR_WEIGHT = 30;
  const CONF_WEIGHT = 15;

  let score =
    edge * EDGE_WEIGHT +
    trendFactor * TREND_WEIGHT +
    directionStrength * DIR_WEIGHT +
    confidence * CONF_WEIGHT;

  // Regime adjustments
  const regime = (() => {
    if (probNeutral > 0.85) return "low-vol chop";
    if (edge > 0.15 && confidence > 0.7) return "trending";
    if (edge > 0.1) return "high-vol breakout";
    if (edge < 0.05) return "reverting";
    return "mixed";
  })();

  if (regime === "trending") score *= 1.08;
  if (regime === "high-vol breakout") score *= 1.12;
  if (regime === "low-vol chop") score *= 0.75;
  if (regime === "reverting") score *= 0.9;

  return Math.round(Math.min(100, Math.max(0, score)));
}

export async function handleGetQuantSignals(
  rawInput: unknown
): Promise<GetQuantSignalsOutput> {
  const input: GetQuantSignalsInput =
    GetQuantSignalsInputSchema.parse(rawInput);

  const tickers = input.tickers.map((t) => t.toUpperCase());

  // Get latest predictions for each ticker
  const predictions = await prisma.livePrediction.findMany({
    where: { ticker: { in: tickers } },
    orderBy: { createdAt: "desc" },
    distinct: ["ticker"],
  });

  const signals = predictions.map((p) => ({
    ticker: p.ticker,
    signal: p.signal as "BUY" | "SELL" | "NEUTRAL",
    confidence: p.confidence,
    probUp: p.probUp,
    probNeutral: p.probNeutral,
    probDown: p.probDown,
    quantScore: calculateQuantScore(
      p.probUp,
      p.probDown,
      p.probNeutral,
      p.confidence
    ),
    shouldTrade: p.shouldTrade,
    takeProfit: p.takeProfit ?? undefined,
    stopLoss: p.stopLoss ?? undefined,
    currentPrice: p.currentPrice,
    timestamp: p.timestamp.toISOString(),
  }));

  let forecasts;
  if (input.includeForecasts) {
    const forecastData = await prisma.distribionalForecast.findMany({
      where: { ticker: { in: tickers } },
      orderBy: { createdAt: "desc" },
      distinct: ["ticker"],
    });

    forecasts = forecastData.map((f) => ({
      ticker: f.ticker,
      directionalBias: f.directionalBias as "Bullish" | "Bearish" | "Neutral",
      conviction: f.conviction as "High" | "Medium" | "Low",
      expectedRangePct: f.expectedRangePct,
      upperBound: f.upperBound,
      lowerBound: f.lowerBound,
      probLargeUp: f.probLargeUp,
      probMildUp: f.probMildUp,
      probFlat: f.probFlat,
      probMildDown: f.probMildDown,
      probLargeDown: f.probLargeDown,
    }));
  }

  const output: GetQuantSignalsOutput = {
    signals,
    forecasts,
    asOf: nowIso(),
  };

  GetQuantSignalsOutputSchema.parse(output);
  return output;
}

export const getQuantSignalsTool = {
  ...GetQuantSignalsToolSpec,
  handler: handleGetQuantSignals,
} as const;
