import {
  GetSentinelReportInputSchema,
  GetSentinelReportOutputSchema,
  GetSentinelReportToolSpec,
  type GetSentinelReportInput,
  type GetSentinelReportOutput,
} from "@/shared/schemas/tools/getSentinelReport.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetSentinelReport(
  rawInput: unknown
): Promise<GetSentinelReportOutput> {
  const input: GetSentinelReportInput =
    GetSentinelReportInputSchema.parse(rawInput);

  let report;
  if (input.reportId) {
    report = await prisma.sentinelReport.findUnique({
      where: { id: input.reportId },
    });
  } else if (input.latest) {
    report = await prisma.sentinelReport.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  const output: GetSentinelReportOutput = {
    report: report
      ? {
          id: report.id,
          summary: report.summary,
          keyDrivers: (report.keyDrivers as any[]) || [],
          macroContext: report.macroContext ?? undefined,
          anomalies: {
            indexMove: report.indexMove,
            sectorRotation: report.sectorRotation,
            macroSurprise: report.macroSurprise,
            volSpike: report.volSpike,
          },
          vix: report.vix ?? undefined,
          vixChangePct: report.vixChangePct ?? undefined,
          createdAt: report.createdAt.toISOString(),
        }
      : null,
    asOf: nowIso(),
  };

  GetSentinelReportOutputSchema.parse(output);
  return output;
}

export const getSentinelReportTool = {
  ...GetSentinelReportToolSpec,
  handler: handleGetSentinelReport,
} as const;
