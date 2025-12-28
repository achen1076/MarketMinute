import { z } from "zod";

export const GetMarketSummaryInputSchema = z.object({
  indices: z
    .array(z.string())
    .optional()
    .default(["SPY", "QQQ", "DIA", "IWM", "VIX"]),
});

export type GetMarketSummaryInput = z.infer<typeof GetMarketSummaryInputSchema>;

export const IndexSnapshotSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  changePct: z.number(),
});

export const GetMarketSummaryOutputSchema = z.object({
  indices: z.array(IndexSnapshotSchema),
  marketStatus: z.enum(["open", "closed", "pre-market", "after-hours"]),
  asOf: z.string(),
});

export type GetMarketSummaryOutput = z.infer<
  typeof GetMarketSummaryOutputSchema
>;

export const GetMarketSummaryToolSpec = {
  name: "get_market_summary",
  description:
    "Get a summary of major market indices (SPY, QQQ, DIA, IWM, VIX) and current market status.",
  inputSchema: GetMarketSummaryInputSchema,
  outputSchema: GetMarketSummaryOutputSchema,
} as const;
