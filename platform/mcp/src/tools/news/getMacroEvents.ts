import {
  GetMacroEventsInputSchema,
  GetMacroEventsOutputSchema,
  GetMacroEventsToolSpec,
  type GetMacroEventsInput,
  type GetMacroEventsOutput,
} from "@/shared/schemas/tools/getMacroEvents.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetMacroEvents(
  rawInput: unknown
): Promise<GetMacroEventsOutput> {
  const input: GetMacroEventsInput = GetMacroEventsInputSchema.parse(rawInput);

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + input.daysAhead);

  const whereClause: any = {
    date: {
      gte: today.toISOString().split("T")[0],
      lte: futureDate.toISOString().split("T")[0],
    },
  };

  if (input.eventTypes && input.eventTypes.length > 0) {
    whereClause.type = { in: input.eventTypes };
  }

  const events = await prisma.macroEvent.findMany({
    where: whereClause,
    orderBy: { date: "asc" },
  });

  const output: GetMacroEventsOutput = {
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      date: e.date,
      description: e.description ?? undefined,
    })),
    asOf: nowIso(),
  };

  GetMacroEventsOutputSchema.parse(output);
  return output;
}

export const getMacroEventsTool = {
  ...GetMacroEventsToolSpec,
  handler: handleGetMacroEvents,
} as const;
