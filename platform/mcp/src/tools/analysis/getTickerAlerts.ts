import {
  GetTickerAlertsInputSchema,
  GetTickerAlertsOutputSchema,
  GetTickerAlertsToolSpec,
  type GetTickerAlertsInput,
  type GetTickerAlertsOutput,
} from "@/shared/schemas/tools/getTickerAlerts.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetTickerAlerts(
  rawInput: unknown
): Promise<GetTickerAlertsOutput> {
  const input: GetTickerAlertsInput =
    GetTickerAlertsInputSchema.parse(rawInput);

  const tickers = input.tickers.map((t) => t.toUpperCase());

  const whereClause: any = {
    symbol: { in: tickers },
  };

  if (input.types && input.types.length > 0) {
    whereClause.type = { in: input.types };
  }

  const alerts = await prisma.tickerAlert.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: input.limit,
  });

  const output: GetTickerAlertsOutput = {
    alerts: alerts.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      type: a.type,
      title: a.title,
      message: a.message,
      severity: a.severity as "info" | "warning" | "critical",
      createdAt: a.createdAt.toISOString(),
    })),
    asOf: nowIso(),
  };

  GetTickerAlertsOutputSchema.parse(output);
  return output;
}

export const getTickerAlertsTool = {
  ...GetTickerAlertsToolSpec,
  handler: handleGetTickerAlerts,
} as const;
