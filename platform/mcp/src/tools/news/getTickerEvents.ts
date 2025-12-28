import {
  GetTickerEventsInputSchema,
  GetTickerEventsOutputSchema,
  GetTickerEventsToolSpec,
  type GetTickerEventsInput,
  type GetTickerEventsOutput,
} from "@/shared/schemas/tools/getTickerEvents.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetTickerEvents(
  rawInput: unknown
): Promise<GetTickerEventsOutput> {
  const input: GetTickerEventsInput =
    GetTickerEventsInputSchema.parse(rawInput);

  const tickers = input.tickers.map((t) => t.toUpperCase());
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + input.daysAhead);

  const whereClause: any = {
    symbol: { in: tickers },
    date: {
      gte: today.toISOString().split("T")[0],
      lte: futureDate.toISOString().split("T")[0],
    },
  };

  if (input.eventTypes && input.eventTypes.length > 0) {
    whereClause.type = { in: input.eventTypes };
  }

  const events = await prisma.tickerEvent.findMany({
    where: whereClause,
    orderBy: { date: "asc" },
  });

  const output: GetTickerEventsOutput = {
    events: events.map((e) => ({
      id: e.id,
      symbol: e.symbol,
      type: e.type,
      title: e.title,
      date: e.date,
      description: e.description ?? undefined,
    })),
    asOf: nowIso(),
  };

  GetTickerEventsOutputSchema.parse(output);
  return output;
}

export const getTickerEventsTool = {
  ...GetTickerEventsToolSpec,
  handler: handleGetTickerEvents,
} as const;
