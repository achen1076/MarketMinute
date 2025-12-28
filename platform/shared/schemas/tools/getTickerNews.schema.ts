import { z } from "zod";

export const GetTickerNewsInputSchema = z.object({
  tickers: z.array(z.string()).min(1).max(10),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

export type GetTickerNewsInput = z.infer<typeof GetTickerNewsInputSchema>;

export const NewsItemSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  headline: z.string(),
  summary: z.string().optional(),
  sentiment: z.number(),
  relevance: z.number(),
  category: z.string().optional(),
  createdAt: z.string(),
});

export const GetTickerNewsOutputSchema = z.object({
  news: z.array(NewsItemSchema),
  asOf: z.string(),
});

export type GetTickerNewsOutput = z.infer<typeof GetTickerNewsOutputSchema>;

export const GetTickerNewsToolSpec = {
  name: "get_ticker_news",
  description:
    "Get recent news headlines for specific tickers with sentiment scores.",
  inputSchema: GetTickerNewsInputSchema,
  outputSchema: GetTickerNewsOutputSchema,
} as const;
