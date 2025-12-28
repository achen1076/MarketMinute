import {
  GetMarketSummaryInputSchema,
  GetMarketSummaryOutputSchema,
  GetMarketSummaryToolSpec,
  type GetMarketSummaryInput,
  type GetMarketSummaryOutput,
} from "@/shared/schemas/tools/getMarketSummary.schema";

import { fetchFmpQuoteSnapshot } from "../../adapters/fmp/quoteSnapshot";
import { nowIso } from "../../ops/time";

const INDEX_NAMES: Record<string, string> = {
  SPY: "S&P 500 ETF",
  QQQ: "Nasdaq 100 ETF",
  DIA: "Dow Jones ETF",
  IWM: "Russell 2000 ETF",
  VIX: "Volatility Index",
};

function getMarketStatus(): "open" | "closed" | "pre-market" | "after-hours" {
  const now = new Date();
  const nyTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = nyTime.getDay();
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  if (day === 0 || day === 6) return "closed";

  if (timeInMinutes >= 570 && timeInMinutes < 960) return "open"; // 9:30 AM - 4:00 PM
  if (timeInMinutes >= 240 && timeInMinutes < 570) return "pre-market"; // 4:00 AM - 9:30 AM
  if (timeInMinutes >= 960 && timeInMinutes < 1200) return "after-hours"; // 4:00 PM - 8:00 PM

  return "closed";
}

export async function handleGetMarketSummary(
  rawInput: unknown
): Promise<GetMarketSummaryOutput> {
  const input: GetMarketSummaryInput =
    GetMarketSummaryInputSchema.parse(rawInput);

  const quotes = await fetchFmpQuoteSnapshot(input.indices);

  const indices = quotes.map((q) => ({
    symbol: q.symbol || q.ticker || "",
    name: INDEX_NAMES[q.symbol || q.ticker || ""] || q.symbol || "",
    price: q.price,
    change: q.change ?? 0,
    changePct: Math.round((q.changesPercentage ?? 0) * 100) / 100,
  }));

  const output: GetMarketSummaryOutput = {
    indices,
    marketStatus: getMarketStatus(),
    asOf: nowIso(),
  };

  GetMarketSummaryOutputSchema.parse(output);
  return output;
}

export const getMarketSummaryTool = {
  ...GetMarketSummaryToolSpec,
  handler: handleGetMarketSummary,
} as const;
