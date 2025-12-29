import { z } from "zod";

export const GetTopSignalsInputSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe("Number of top signals to return"),
  qualityFilter: z
    .enum(["all", "deployable", "excellent", "good"])
    .optional()
    .default("deployable")
    .describe("Filter by model quality"),
  signalType: z
    .enum(["all", "BUY", "SELL"])
    .optional()
    .default("all")
    .describe("Filter by signal direction"),
});

export type GetTopSignalsInput = z.infer<typeof GetTopSignalsInputSchema>;

export const TopSignalItemSchema = z.object({
  ticker: z.string(),
  signal: z.enum(["BUY", "SELL", "NEUTRAL"]),
  quantScore: z.number(),
  confidence: z.number(),
  qualityTier: z.string(),
  currentPrice: z.number(),
});

export type TopSignalItem = z.infer<typeof TopSignalItemSchema>;

export const GetTopSignalsOutputSchema = z.object({
  signals: z.array(TopSignalItemSchema),
  count: z.number(),
  asOf: z.string(),
});

export type GetTopSignalsOutput = z.infer<typeof GetTopSignalsOutputSchema>;

export const GetTopSignalsToolSpec = {
  name: "get_top_signals",
  description:
    "Get the top tradeable signals ranked by quant score. Filters by model quality and signal direction.",
  inputSchema: GetTopSignalsInputSchema,
  outputSchema: GetTopSignalsOutputSchema,
} as const;
