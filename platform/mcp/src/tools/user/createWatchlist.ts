import {
  CreateWatchlistInputSchema,
  CreateWatchlistOutputSchema,
  CreateWatchlistToolSpec,
  type CreateWatchlistInput,
  type CreateWatchlistOutput,
} from "@/shared/schemas/tools/createWatchlist.schema";

import { prisma } from "../../ops/dbcache";

export async function handleCreateWatchlist(
  rawInput: unknown
): Promise<CreateWatchlistOutput> {
  const input: CreateWatchlistInput =
    CreateWatchlistInputSchema.parse(rawInput);

  // If setting as favorite, unfavorite existing favorites
  if (input.setAsFavorite) {
    await prisma.watchlist.updateMany({
      where: { userId: input.userId, isFavorite: true },
      data: { isFavorite: false },
    });
  }

  // Create the watchlist
  const watchlist = await prisma.watchlist.create({
    data: {
      userId: input.userId,
      name: input.name,
      isFavorite: input.setAsFavorite ?? false,
      items: input.tickers
        ? {
            create: input.tickers.map((symbol, index) => ({
              symbol: symbol.toUpperCase(),
              order: index,
            })),
          }
        : undefined,
    },
    include: { items: true },
  });

  const output: CreateWatchlistOutput = {
    watchlistId: watchlist.id,
    name: watchlist.name,
    tickers: watchlist.items.map((i) => i.symbol),
    isFavorite: watchlist.isFavorite,
    createdAt: watchlist.createdAt.toISOString(),
  };

  CreateWatchlistOutputSchema.parse(output);
  return output;
}

export const createWatchlistTool = {
  ...CreateWatchlistToolSpec,
  handler: handleCreateWatchlist,
} as const;
