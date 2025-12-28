import { z } from "zod";

export const GetInsightsInputSchema = z.object({
  latest: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(10).optional().default(5),
});

export type GetInsightsInput = z.infer<typeof GetInsightsInputSchema>;

export const InsightCardSchema = z.object({
  type: z.string(),
  title: z.string(),
  body: z.string(),
  tickers: z.array(z.string()).optional(),
  severity: z.string().optional(),
});

export const GetInsightsOutputSchema = z.object({
  cards: z.array(InsightCardSchema),
  sentinelReportId: z.string().optional(),
  asOf: z.string(),
});

export type GetInsightsOutput = z.infer<typeof GetInsightsOutputSchema>;

export const GetInsightsToolSpec = {
  name: "get_insights",
  description:
    "Get AI-generated insight cards from the latest Sentinel analysis.",
  inputSchema: GetInsightsInputSchema,
  outputSchema: GetInsightsOutputSchema,
} as const;
