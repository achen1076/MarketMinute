import { z } from "zod";

export const GetModelQualityInputSchema = z.object({
  tickers: z
    .array(z.string())
    .optional()
    .describe(
      "Optional list of tickers to filter. If empty, returns all models."
    ),
  qualityTier: z
    .enum(["excellent", "good", "marginal", "poor"])
    .optional()
    .describe("Filter by quality tier"),
  deployableOnly: z
    .boolean()
    .optional()
    .describe("If true, only return deployable models (Best + Excellent)"),
});

export type GetModelQualityInput = z.infer<typeof GetModelQualityInputSchema>;

export const ModelQualityItemSchema = z.object({
  ticker: z.string(),
  qualityTier: z.enum(["excellent", "good", "marginal", "poor"]),
  qualityLabel: z.string(),
  deployable: z.boolean(),
  sharpeRatio: z.number(),
  profitFactor: z.number().nullable(),
  winRate: z.number(),
  accuracy: z.number(),
});

export type ModelQualityItem = z.infer<typeof ModelQualityItemSchema>;

export const GetModelQualityOutputSchema = z.object({
  models: z.array(ModelQualityItemSchema),
  summary: z.object({
    total: z.number(),
    excellent: z.number(),
    good: z.number(),
    marginal: z.number(),
    poor: z.number(),
    deployable: z.number(),
  }),
  asOf: z.string(),
});

export type GetModelQualityOutput = z.infer<typeof GetModelQualityOutputSchema>;

export const GetModelQualityToolSpec = {
  name: "get_model_quality",
  description:
    "Get quality metrics for ML prediction models. Quality tiers: Best (excellent Sharpe & PF), Excellent (good metrics), Good (marginal), Low Quality (poor). Deployable models are recommended for trading.",
  inputSchema: GetModelQualityInputSchema,
  outputSchema: GetModelQualityOutputSchema,
} as const;
