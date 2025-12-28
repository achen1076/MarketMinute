import {
  GetInsightsInputSchema,
  GetInsightsOutputSchema,
  GetInsightsToolSpec,
  type GetInsightsInput,
  type GetInsightsOutput,
} from "@/shared/schemas/tools/getInsights.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetInsights(
  rawInput: unknown
): Promise<GetInsightsOutput> {
  const input: GetInsightsInput = GetInsightsInputSchema.parse(rawInput);

  const insightReport = await prisma.insightReport.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!insightReport) {
    return {
      cards: [],
      asOf: nowIso(),
    };
  }

  const allCards = (insightReport.cards as any[]) || [];
  const cards = allCards.slice(0, input.limit).map((c) => ({
    type: c.type || "insight",
    title: c.title || "",
    body: c.body || c.content || "",
    tickers: c.tickers,
    severity: c.severity,
  }));

  const output: GetInsightsOutput = {
    cards,
    sentinelReportId: insightReport.sentinelReportId ?? undefined,
    asOf: nowIso(),
  };

  GetInsightsOutputSchema.parse(output);
  return output;
}

export const getInsightsTool = {
  ...GetInsightsToolSpec,
  handler: handleGetInsights,
} as const;
