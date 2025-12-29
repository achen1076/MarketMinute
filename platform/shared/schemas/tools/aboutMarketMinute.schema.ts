import { z } from "zod";

export const AboutMarketMinuteInputSchema = z.object({
  topic: z
    .enum(["overview", "features", "quantlab", "sentinel", "pricing", "all"])
    .optional()
    .default("all")
    .describe("Specific topic to get info about"),
});

export type AboutMarketMinuteInput = z.infer<
  typeof AboutMarketMinuteInputSchema
>;

export const AboutMarketMinuteOutputSchema = z.object({
  overview: z.string().optional(),
  features: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  quantlab: z.string().optional(),
  sentinel: z.string().optional(),
  pricing: z.string().optional(),
});

export type AboutMarketMinuteOutput = z.infer<
  typeof AboutMarketMinuteOutputSchema
>;

export const AboutMarketMinuteToolSpec = {
  name: "about_marketminute",
  description:
    "Get information about MarketMinute platform, its features, QuantLab ML predictions, Sentinel AI briefings, and pricing tiers.",
  inputSchema: AboutMarketMinuteInputSchema,
  outputSchema: AboutMarketMinuteOutputSchema,
} as const;
