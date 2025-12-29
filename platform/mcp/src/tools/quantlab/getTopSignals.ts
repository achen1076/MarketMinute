import {
  GetTopSignalsInputSchema,
  GetTopSignalsOutputSchema,
  GetTopSignalsToolSpec,
  type GetTopSignalsInput,
  type GetTopSignalsOutput,
} from "@/shared/schemas/tools/getTopSignals.schema";

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

async function fetchModelQuality(): Promise<Record<string, any>> {
  const apiUrl = process.env.WEBAPP_URL || "https://market-minute.vercel.app";

  try {
    const response = await fetch(`${apiUrl}/api/quant/model-metadata`);
    if (!response.ok) return {};
    const data = (await response.json()) as { models?: Record<string, any> };
    return data.models || {};
  } catch {
    return {};
  }
}

export async function handleGetTopSignals(
  rawInput: unknown
): Promise<GetTopSignalsOutput> {
  const input: GetTopSignalsInput = GetTopSignalsInputSchema.parse(rawInput);

  const limit = input.limit || 10;
  const qualityFilter = input.qualityFilter || "deployable";
  const signalType = input.signalType || "all";

  // Get all predictions
  const predictions = await prisma.livePrediction.findMany({
    where: signalType !== "all" ? { signal: signalType } : undefined,
    orderBy: { createdAt: "desc" },
    distinct: ["ticker"],
  });

  // Get model quality data
  const modelQuality = await fetchModelQuality();

  // Calculate scores and filter
  let signals = predictions
    .map((p) => {
      const quality = modelQuality[p.ticker];
      const quantScore = calculateQuantScore(
        p.probUp,
        p.probDown,
        p.probNeutral,
        p.confidence
      );

      return {
        ticker: p.ticker,
        signal: p.signal as "BUY" | "SELL" | "NEUTRAL",
        quantScore,
        confidence: p.confidence,
        qualityTier: quality?.quality_tier || "unknown",
        deployable: quality?.deployable || false,
        currentPrice: p.currentPrice,
        shouldTrade: p.shouldTrade,
      };
    })
    .filter((s) => s.shouldTrade && s.signal !== "NEUTRAL");

  // Apply quality filter
  if (qualityFilter === "deployable") {
    signals = signals.filter((s) => s.deployable);
  } else if (qualityFilter !== "all") {
    signals = signals.filter((s) => s.qualityTier === qualityFilter);
  }

  // Sort by quant score and limit
  signals = signals.sort((a, b) => b.quantScore - a.quantScore).slice(0, limit);

  const output: GetTopSignalsOutput = {
    signals: signals.map((s) => ({
      ticker: s.ticker,
      signal: s.signal,
      quantScore: s.quantScore,
      confidence: s.confidence,
      qualityTier: s.qualityTier,
      currentPrice: s.currentPrice,
    })),
    count: signals.length,
    asOf: nowIso(),
  };

  GetTopSignalsOutputSchema.parse(output);
  return output;
}

export const getTopSignalsTool = {
  ...GetTopSignalsToolSpec,
  handler: handleGetTopSignals,
} as const;
