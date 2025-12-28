import {
  GetAlertsInputSchema,
  GetAlertsOutputSchema,
  GetAlertsToolSpec,
  type GetAlertsInput,
  type GetAlertsOutput,
} from "@/shared/schemas/tools/getAlerts.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetAlerts(
  rawInput: unknown
): Promise<GetAlertsOutput> {
  const input: GetAlertsInput = GetAlertsInputSchema.parse(rawInput);

  const whereClause: any = { userId: input.userId };
  if (input.unreadOnly) {
    whereClause.read = false;
  }

  const alerts = await prisma.alert.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: input.limit,
  });

  const unreadCount = await prisma.alert.count({
    where: { userId: input.userId, read: false },
  });

  const output: GetAlertsOutput = {
    alerts: alerts.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      message: a.message,
      symbol: a.symbol ?? undefined,
      severity: a.severity as "info" | "warning" | "critical",
      read: a.read,
      createdAt: a.createdAt.toISOString(),
    })),
    unreadCount,
    asOf: nowIso(),
  };

  GetAlertsOutputSchema.parse(output);
  return output;
}

export const getAlertsTool = {
  ...GetAlertsToolSpec,
  handler: handleGetAlerts,
} as const;
