import {
  GetQuoteSnapshotInputSchema,
  GetQuoteSnapshotOutputSchema,
  GetQuoteSnapshotToolSpec,
  type GetQuoteSnapshotInput,
  type GetQuoteSnapshotOutput,
} from "@/shared/schemas/tools/getQuoteSnapshot.schema";

import { fetchFmpQuoteSnapshot } from "../../adapters/fmp/quoteSnapshot";
import { dbCacheGet, dbCacheSet } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

/**
 * MCP Tool Handler: get_quote_snapshot
 *
 * Notes:
 * - Enforces hard caps via schema
 * - Uses DB-backed caching to avoid hammering FMP
 * - Normalizes provider payload into MarketMinute DTOs
 */
export async function handleGetQuoteSnapshot(
  rawInput: unknown
): Promise<GetQuoteSnapshotOutput> {
  const input: GetQuoteSnapshotInput =
    GetQuoteSnapshotInputSchema.parse(rawInput);

  const tickers = input.tickers.map((t) => t.toUpperCase());
  const maxAgeSeconds = input.maxAgeSeconds ?? 60;

  // Cache key is order-insensitive to maximize hit rate
  const cacheKey = `quote_snapshot:${tickers.slice().sort().join(",")}`;
  const cached = await dbCacheGet<GetQuoteSnapshotOutput>(cacheKey);
  if (cached) return cached;

  const providerRows = await fetchFmpQuoteSnapshot(tickers);

  // Normalize
  const asOf = nowIso();

  const foundSymbols = new Set<string>();
  const quotes = providerRows.map((row) => {
    const symbol = String(row.symbol || row.ticker || "").toUpperCase();
    foundSymbols.add(symbol);

    return {
      symbol,
      price: Number(row.price),
      change: row.change != null ? Number(row.change) : undefined,
      changePct:
        row.changesPercentage != null
          ? Number(row.changesPercentage)
          : undefined,
      dayHigh: row.dayHigh != null ? Number(row.dayHigh) : undefined,
      dayLow: row.dayLow != null ? Number(row.dayLow) : undefined,
      volume: row.volume != null ? Number(row.volume) : undefined,
      marketCap: row.marketCap != null ? Number(row.marketCap) : undefined,
      high52w: row.yearHigh != null ? Number(row.yearHigh) : undefined,
      low52w: row.yearLow != null ? Number(row.yearLow) : undefined,
      asOf,
      source: "fmp",
    };
  });

  const missing = tickers.filter((t) => !foundSymbols.has(t));

  const output: GetQuoteSnapshotOutput = {
    quotes,
    requested: tickers,
    missing,
    asOf,
  };

  GetQuoteSnapshotOutputSchema.parse(output);

  await dbCacheSet(cacheKey, output, maxAgeSeconds);

  return output;
}

/**
 * Export a tool registration object that your MCP server bootstrap can consume.
 * (We’ll wire this in server.ts next.)
 */
export const getQuoteSnapshotTool = {
  ...GetQuoteSnapshotToolSpec,
  handler: handleGetQuoteSnapshot,
} as const;
