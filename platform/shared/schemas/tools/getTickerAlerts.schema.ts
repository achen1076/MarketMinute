import { z } from "zod";

export const GetTickerAlertsInputSchema = z.object({
  tickers: z.array(z.string()).min(1).max(25),
  types: z
    .array(
      z.enum([
        "sentiment_shift",
        "price_move",
        "earnings",
        "52w_high",
        "52w_low",
      ])
    )
    .optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export type GetTickerAlertsInput = z.infer<typeof GetTickerAlertsInputSchema>;

export const TickerAlertSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  createdAt: z.string(),
});

export const GetTickerAlertsOutputSchema = z.object({
  alerts: z.array(TickerAlertSchema),
  asOf: z.string(),
});

export type GetTickerAlertsOutput = z.infer<typeof GetTickerAlertsOutputSchema>;

export const GetTickerAlertsToolSpec = {
  name: "get_ticker_alerts",
  description:
    "Get recent alerts for specific tickers (sentiment shifts, price moves, earnings, 52-week highs/lows).",
  inputSchema: GetTickerAlertsInputSchema,
  outputSchema: GetTickerAlertsOutputSchema,
} as const;
