import {
  GetSentimentInputSchema,
  GetSentimentOutputSchema,
  GetSentimentToolSpec,
  type GetSentimentInput,
  type GetSentimentOutput,
} from "@/shared/schemas/tools/getSentiment.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetSentiment(
  rawInput: unknown
): Promise<GetSentimentOutput> {
  const input: GetSentimentInput = GetSentimentInputSchema.parse(rawInput);

  const tickers = input.tickers.map((t) => t.toUpperCase());
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - input.days);

  const sentimentData = await Promise.all(
    tickers.map(async (symbol) => {
      const history = await prisma.sentimentHistory.findMany({
        where: {
          symbol,
          date: { gte: startDate },
        },
        orderBy: { date: "desc" },
      });

      const currentSentiment = history[0]?.sentiment ?? 0;
      const previousSentiment = history[1]?.sentiment ?? currentSentiment;

      let sentimentTrend: "improving" | "declining" | "stable" = "stable";
      const diff = currentSentiment - previousSentiment;
      if (diff > 0.1) sentimentTrend = "improving";
      else if (diff < -0.1) sentimentTrend = "declining";

      return {
        symbol,
        currentSentiment: Math.round(currentSentiment * 100) / 100,
        sentimentTrend,
        newsCount: history.reduce((sum, h) => sum + h.newsCount, 0),
        history: history.map((h) => ({
          date: h.date.toISOString().split("T")[0],
          sentiment: Math.round(h.sentiment * 100) / 100,
          newsCount: h.newsCount,
        })),
      };
    })
  );

  const output: GetSentimentOutput = {
    sentiment: sentimentData,
    asOf: nowIso(),
  };

  GetSentimentOutputSchema.parse(output);
  return output;
}

export const getSentimentTool = {
  ...GetSentimentToolSpec,
  handler: handleGetSentiment,
} as const;
