import { z } from "zod";

export const GetQuantSignalsInputSchema = z.object({
  tickers: z.array(z.string()).min(1).max(25),
  includeForecasts: z.boolean().optional().default(true),
});

export type GetQuantSignalsInput = z.infer<typeof GetQuantSignalsInputSchema>;

export const QuantSignalSchema = z.object({
  ticker: z.string(),
  signal: z.enum(["BUY", "SELL", "NEUTRAL"]),
  confidence: z.number(),
  probUp: z.number(),
  probNeutral: z.number(),
  probDown: z.number(),
  quantScore: z.number(),
  shouldTrade: z.boolean(),
  takeProfit: z.number().optional(),
  stopLoss: z.number().optional(),
  currentPrice: z.number(),
  timestamp: z.string(),
});

export const DistributionalForecastSchema = z.object({
  ticker: z.string(),
  directionalBias: z.enum(["Bullish", "Bearish", "Neutral"]),
  conviction: z.enum(["High", "Medium", "Low"]),
  expectedRangePct: z.number(),
  upperBound: z.number(),
  lowerBound: z.number(),
  probLargeUp: z.number(),
  probMildUp: z.number(),
  probFlat: z.number(),
  probMildDown: z.number(),
  probLargeDown: z.number(),
});

export const GetQuantSignalsOutputSchema = z.object({
  signals: z.array(QuantSignalSchema),
  forecasts: z.array(DistributionalForecastSchema).optional(),
  asOf: z.string(),
});

export type GetQuantSignalsOutput = z.infer<typeof GetQuantSignalsOutputSchema>;

export const GetQuantSignalsToolSpec = {
  name: "get_quant_signals",
  description:
    "Get ML-based trading signals and probability forecasts from QuantLab for specified tickers.",
  inputSchema: GetQuantSignalsInputSchema,
  outputSchema: GetQuantSignalsOutputSchema,
} as const;
