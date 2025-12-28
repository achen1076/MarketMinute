import { z } from "zod";

export const GetQuoteSnapshotInputSchema = z.object({
  tickers: z
    .array(
      z
        .string()
        .trim()
        .toUpperCase()
        .min(1, "Ticker must be at least 1 character long")
        .max(10, "Ticker must be at most 10 characters long")
        .regex(/^[A-Z.\-]+$/, "Invalid ticker format")
    )
    .min(1, "At least one ticker is required")
    .max(25, "Maximum 25 tickers allowed"),
  maxAgeSeconds: z.number().int().min(0).max(300).optional().default(60),
});

export type GetQuoteSnapshotInput = z.infer<typeof GetQuoteSnapshotInputSchema>;

export const QuoteSnapshotItemSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number().optional(),
  changePct: z.number().optional(),
  dayHigh: z.number().optional(),
  dayLow: z.number().optional(),
  volume: z.number().optional(),
  marketCap: z.number().optional(),
  high52w: z.number().optional(),
  low52w: z.number().optional(),
  priceAvg50d: z.number().optional(),
  priceAvg200d: z.number().optional(),
  open: z.number().optional(),
  close: z.number().optional(),
  asOf: z.string(),
  source: z.string().default("fmp"),
});

export type QuoteSnapshotItem = z.infer<typeof QuoteSnapshotItemSchema>;

export const GetQuoteSnapshotOutputSchema = z.object({
  quotes: z.array(QuoteSnapshotItemSchema),
  requested: z.array(z.string()),
  missing: z.array(z.string()).default([]),
  asOf: z.string(),
});

export type GetQuoteSnapshotOutput = z.infer<
  typeof GetQuoteSnapshotOutputSchema
>;

/**
 * Tool metadata (used by orchestrator + MCP server registration)
 */
export const GetQuoteSnapshotToolSpec = {
  name: "get_quote_snapshot",
  description:
    "Get a compact quote snapshot (price, change%, volume, market cap) for one or more tickers.",
  inputSchema: GetQuoteSnapshotInputSchema,
  outputSchema: GetQuoteSnapshotOutputSchema,
} as const;
