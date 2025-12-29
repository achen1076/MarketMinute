import {
  GetQuantSignalsInputSchema,
  GetQuantSignalsOutputSchema,
  GetQuantSignalsToolSpec,
  type GetQuantSignalsInput,
  type GetQuantSignalsOutput,
} from "@/shared/schemas/tools/getQuantSignals.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

interface ModelQualityData {
  quality_tier: "excellent" | "good" | "marginal" | "poor";
  deployable: boolean;
  sharpe_ratio: number;
  profit_factor: number | null;
  win_rate: number;
}

const QUALITY_LABELS: Record<string, string> = {
  excellent: "Best",
  good: "Excellent",
  marginal: "Good",
  poor: "Low Quality",
};

async function fetchModelQuality(): Promise<Record<string, ModelQualityData>> {
  const apiUrl = process.env.WEBAPP_URL;

  try {
    const response = await fetch(`${apiUrl}/api/quant/model-metadata`);
    if (!response.ok) return {};
    const data = (await response.json()) as {
      models?: Record<string, ModelQualityData>;
    };
    return data.models || {};
  } catch {
    return {};
  }
}

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

  // Get latest predictions and model quality in parallel
  const [predictions, modelQuality] = await Promise.all([
    prisma.livePrediction.findMany({
      where: { ticker: { in: tickers } },
      orderBy: { createdAt: "desc" },
      distinct: ["ticker"],
    }),
    fetchModelQuality(),
  ]);

  const signals = predictions.map((p) => {
    const quality = modelQuality[p.ticker];
    return {
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
      // Model quality fields
      qualityTier: quality?.quality_tier,
      qualityLabel: quality ? QUALITY_LABELS[quality.quality_tier] : undefined,
      deployable: quality?.deployable,
      sharpeRatio: quality?.sharpe_ratio,
      profitFactor: quality?.profit_factor,
      winRate: quality?.win_rate,
    };
  });

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
