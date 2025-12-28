import {
  GetWatchlistsInputSchema,
  GetWatchlistsOutputSchema,
  GetWatchlistsToolSpec,
  type GetWatchlistsInput,
  type GetWatchlistsOutput,
} from "@/shared/schemas/tools/getWatchlists.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetWatchlists(
  rawInput: unknown
): Promise<GetWatchlistsOutput> {
  const input: GetWatchlistsInput = GetWatchlistsInputSchema.parse(rawInput);

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: input.userId },
    include: { items: { orderBy: { order: "asc" } } },
    orderBy: { isFavorite: "desc" },
  });

  const output: GetWatchlistsOutput = {
    watchlists: watchlists.map((w) => ({
      id: w.id,
      name: w.name,
      isFavorite: w.isFavorite,
      tickers: w.items.map((i) => i.symbol),
    })),
    userId: input.userId,
    asOf: nowIso(),
  };

  GetWatchlistsOutputSchema.parse(output);

  return output;
}

export const getWatchlistsTool = {
  ...GetWatchlistsToolSpec,
  handler: handleGetWatchlists,
} as const;
