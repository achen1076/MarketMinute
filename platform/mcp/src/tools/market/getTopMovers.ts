import {
  GetTopMoversInputSchema,
  GetTopMoversOutputSchema,
  GetTopMoversToolSpec,
  type GetTopMoversInput,
  type GetTopMoversOutput,
} from "@/shared/schemas/tools/getTopMovers.schema";

import { prisma } from "../../ops/dbcache";
import { fetchFmpQuoteSnapshot } from "../../adapters/fmp/quoteSnapshot";
import { nowIso } from "../../ops/time";

export async function handleGetTopMovers(
  rawInput: unknown
): Promise<GetTopMoversOutput> {
  const input: GetTopMoversInput = GetTopMoversInputSchema.parse(rawInput);

  let watchlist;
  if (input.watchlistId) {
    watchlist = await prisma.watchlist.findUnique({
      where: { id: input.watchlistId, userId: input.userId },
      include: { items: true },
    });
  } else if (input.watchlistName) {
    watchlist = await prisma.watchlist.findFirst({
      where: {
        userId: input.userId,
        name: { equals: input.watchlistName, mode: "insensitive" },
      },
      include: { items: true },
    });
  }

  if (!watchlist) {
    throw new Error("Watchlist not found");
  }

  const tickers = watchlist.items.map((i) => i.symbol);
  if (tickers.length === 0) {
    return {
      watchlist: watchlist.name,
      direction: input.direction,
      movers: [],
      asOf: nowIso(),
    };
  }

  const quotes = await fetchFmpQuoteSnapshot(tickers);

  const sorted = quotes
    .filter((q) => q.changesPercentage != null)
    .sort((a, b) =>
      input.direction === "gainers"
        ? (b.changesPercentage ?? 0) - (a.changesPercentage ?? 0)
        : (a.changesPercentage ?? 0) - (b.changesPercentage ?? 0)
    )
    .slice(0, input.limit);

  const movers = sorted.map((q) => ({
    symbol: q.symbol || q.ticker || "",
    price: q.price,
    change: q.change ?? 0,
    changePct: Math.round((q.changesPercentage ?? 0) * 100) / 100,
    volume: q.volume,
  }));

  const output: GetTopMoversOutput = {
    watchlist: watchlist.name,
    direction: input.direction,
    movers,
    asOf: nowIso(),
  };

  GetTopMoversOutputSchema.parse(output);
  return output;
}

export const getTopMoversTool = {
  ...GetTopMoversToolSpec,
  handler: handleGetTopMovers,
} as const;
