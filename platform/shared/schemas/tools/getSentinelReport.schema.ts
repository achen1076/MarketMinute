import { z } from "zod";

export const GetSentinelReportInputSchema = z.object({
  latest: z.boolean().optional().default(true),
  reportId: z.string().optional(),
});

export type GetSentinelReportInput = z.infer<
  typeof GetSentinelReportInputSchema
>;

export const KeyDriverSchema = z.object({
  ticker: z.string().optional(),
  headline: z.string(),
  impact: z.string().optional(),
});

export const SentinelReportSchema = z.object({
  id: z.string(),
  summary: z.string(),
  keyDrivers: z.array(KeyDriverSchema),
  macroContext: z.string().optional(),
  anomalies: z.object({
    indexMove: z.boolean(),
    sectorRotation: z.boolean(),
    macroSurprise: z.boolean(),
    volSpike: z.boolean(),
  }),
  vix: z.number().optional(),
  vixChangePct: z.number().optional(),
  createdAt: z.string(),
});

export const GetSentinelReportOutputSchema = z.object({
  report: SentinelReportSchema.nullable(),
  asOf: z.string(),
});

export type GetSentinelReportOutput = z.infer<
  typeof GetSentinelReportOutputSchema
>;

export const GetSentinelReportToolSpec = {
  name: "get_sentinel_report",
  description:
    "Get the latest Sentinel AI market analysis report with key drivers, macro context, and anomaly flags.",
  inputSchema: GetSentinelReportInputSchema,
  outputSchema: GetSentinelReportOutputSchema,
} as const;
