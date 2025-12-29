import {
  GetModelQualityInputSchema,
  GetModelQualityOutputSchema,
  GetModelQualityToolSpec,
  type GetModelQualityInput,
  type GetModelQualityOutput,
} from "@/shared/schemas/tools/getModelQuality.schema";

import { nowIso } from "../../ops/time";

const QUALITY_LABELS: Record<string, string> = {
  excellent: "Best",
  good: "Excellent",
  marginal: "Good",
  poor: "Low Quality",
};

async function fetchModelMetadata(): Promise<Record<string, any>> {
  const apiUrl = process.env.WEBAPP_URL || "https://market-minute.vercel.app";

  try {
    const response = await fetch(`${apiUrl}/api/quant/model-metadata`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[getModelQuality] API error: ${response.status}`);
      return {};
    }

    const data = (await response.json()) as { models?: Record<string, any> };
    return data.models || {};
  } catch (error) {
    console.error("[getModelQuality] Failed to fetch:", error);
    return {};
  }
}

export async function handleGetModelQuality(
  rawInput: unknown
): Promise<GetModelQualityOutput> {
  const input: GetModelQualityInput =
    GetModelQualityInputSchema.parse(rawInput);

  const allModels = await fetchModelMetadata();

  let models = Object.values(allModels) as any[];

  // Filter by tickers if provided
  if (input.tickers && input.tickers.length > 0) {
    const tickerSet = new Set(input.tickers.map((t) => t.toUpperCase()));
    models = models.filter((m) => tickerSet.has(m.ticker.toUpperCase()));
  }

  // Filter by quality tier
  if (input.qualityTier) {
    models = models.filter((m) => m.quality_tier === input.qualityTier);
  }

  // Filter by deployable
  if (input.deployableOnly) {
    models = models.filter((m) => m.deployable);
  }

  const summary = {
    total: models.length,
    excellent: models.filter((m) => m.quality_tier === "excellent").length,
    good: models.filter((m) => m.quality_tier === "good").length,
    marginal: models.filter((m) => m.quality_tier === "marginal").length,
    poor: models.filter((m) => m.quality_tier === "poor").length,
    deployable: models.filter((m) => m.deployable).length,
  };

  const output: GetModelQualityOutput = {
    models: models.map((m) => ({
      ticker: m.ticker,
      qualityTier: m.quality_tier,
      qualityLabel: QUALITY_LABELS[m.quality_tier] || m.quality_tier,
      deployable: m.deployable,
      sharpeRatio: m.sharpe_ratio,
      profitFactor: m.profit_factor,
      winRate: m.win_rate,
      accuracy: m.accuracy,
    })),
    summary,
    asOf: nowIso(),
  };

  GetModelQualityOutputSchema.parse(output);
  return output;
}

export const getModelQualityTool = {
  ...GetModelQualityToolSpec,
  handler: handleGetModelQuality,
} as const;
