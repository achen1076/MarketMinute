import { z } from "zod";

export const GetTickerEventsInputSchema = z.object({
  tickers: z.array(z.string()).min(1).max(25),
  eventTypes: z
    .array(z.enum(["earnings", "dividend", "conference", "other"]))
    .optional(),
  daysAhead: z.number().int().min(1).max(90).optional().default(30),
});

export type GetTickerEventsInput = z.infer<typeof GetTickerEventsInputSchema>;

export const TickerEventSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  type: z.string(),
  title: z.string(),
  date: z.string(),
  description: z.string().optional(),
});

export const GetTickerEventsOutputSchema = z.object({
  events: z.array(TickerEventSchema),
  asOf: z.string(),
});

export type GetTickerEventsOutput = z.infer<typeof GetTickerEventsOutputSchema>;

export const GetTickerEventsToolSpec = {
  name: "get_ticker_events",
  description:
    "Get upcoming events (earnings, dividends, conferences) for specific tickers.",
  inputSchema: GetTickerEventsInputSchema,
  outputSchema: GetTickerEventsOutputSchema,
} as const;
