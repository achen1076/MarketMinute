import { z } from "zod";

export const GetSentimentInputSchema = z.object({
  tickers: z.array(z.string()).min(1).max(25),
  days: z.number().int().min(1).max(30).optional().default(7),
});

export type GetSentimentInput = z.infer<typeof GetSentimentInputSchema>;

export const SentimentDataSchema = z.object({
  symbol: z.string(),
  currentSentiment: z.number(),
  sentimentTrend: z.enum(["improving", "declining", "stable"]),
  newsCount: z.number(),
  history: z.array(
    z.object({
      date: z.string(),
      sentiment: z.number(),
      newsCount: z.number(),
    })
  ),
});

export const GetSentimentOutputSchema = z.object({
  sentiment: z.array(SentimentDataSchema),
  asOf: z.string(),
});

export type GetSentimentOutput = z.infer<typeof GetSentimentOutputSchema>;

export const GetSentimentToolSpec = {
  name: "get_sentiment",
  description:
    "Get sentiment analysis data for tickers including current sentiment, trend, and historical data.",
  inputSchema: GetSentimentInputSchema,
  outputSchema: GetSentimentOutputSchema,
} as const;
