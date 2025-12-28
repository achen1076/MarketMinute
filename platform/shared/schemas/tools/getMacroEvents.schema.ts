import { z } from "zod";

export const GetMacroEventsInputSchema = z.object({
  eventTypes: z
    .array(z.enum(["fomc", "cpi", "jobs", "gdp", "other"]))
    .optional(),
  daysAhead: z.number().int().min(1).max(90).optional().default(30),
});

export type GetMacroEventsInput = z.infer<typeof GetMacroEventsInputSchema>;

export const MacroEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  date: z.string(),
  description: z.string().optional(),
});

export const GetMacroEventsOutputSchema = z.object({
  events: z.array(MacroEventSchema),
  asOf: z.string(),
});

export type GetMacroEventsOutput = z.infer<typeof GetMacroEventsOutputSchema>;

export const GetMacroEventsToolSpec = {
  name: "get_macro_events",
  description:
    "Get upcoming macroeconomic events (FOMC, CPI, jobs reports, GDP releases).",
  inputSchema: GetMacroEventsInputSchema,
  outputSchema: GetMacroEventsOutputSchema,
} as const;
