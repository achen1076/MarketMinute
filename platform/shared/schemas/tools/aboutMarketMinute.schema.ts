import { z } from "zod";

export const AboutMintalyzeInputSchema = z.object({
  topic: z
    .enum(["overview", "features", "quantlab", "sentinel", "pricing", "all"])
    .optional()
    .default("all")
    .describe("Specific topic to get info about"),
});

export type AboutMintalyzeInput = z.infer<typeof AboutMintalyzeInputSchema>;

export const AboutMintalyzeOutputSchema = z.object({
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

export type AboutMintalyzeOutput = z.infer<typeof AboutMintalyzeOutputSchema>;

export const AboutMintalyzeToolSpec = {
  name: "about_mintalyze",
  description:
    "Get information about Mintalyze platform, its features, QuantLab ML predictions, Sentinel AI briefings, and pricing tiers.",
  inputSchema: AboutMintalyzeInputSchema,
  outputSchema: AboutMintalyzeOutputSchema,
} as const;
