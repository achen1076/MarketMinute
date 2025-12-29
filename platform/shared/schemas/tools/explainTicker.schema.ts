import { z } from "zod";

export const ExplainTickerInputSchema = z.object({
  ticker: z.string().min(1, "Ticker symbol is required"),
  context: z
    .enum(["price_movement", "news", "quant_signal", "sentiment", "general"])
    .optional()
    .default("general")
    .describe("What aspect to explain"),
});

export type ExplainTickerInput = z.infer<typeof ExplainTickerInputSchema>;

export const ExplainTickerOutputSchema = z.object({
  ticker: z.string(),
  explanation: z.string(),
  context: z.string(),
  sources: z.array(z.string()).optional(),
  asOf: z.string(),
});

export type ExplainTickerOutput = z.infer<typeof ExplainTickerOutputSchema>;

export const ExplainTickerToolSpec = {
  name: "get_explanation",
  description:
    "Get an AI-generated explanation for why a stock moved, based on recent news and market events. Uses GPT to analyze news headlines and provide key insights.",
  inputSchema: ExplainTickerInputSchema,
  outputSchema: ExplainTickerOutputSchema,
} as const;
