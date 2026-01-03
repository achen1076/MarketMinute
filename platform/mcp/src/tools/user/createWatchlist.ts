import {
  CreateWatchlistInputSchema,
  CreateWatchlistOutputSchema,
  CreateWatchlistToolSpec,
  type CreateWatchlistInput,
  type CreateWatchlistOutput,
} from "@/shared/schemas/tools/createWatchlist.schema";

import { prisma } from "../../ops/dbcache";

// Tier limits (matching webapp/lib/subscription-tiers.ts)
const TIER_LIMITS = {
  free: { maxWatchlists: 2, maxWatchlistItems: 20 },
  basic: { maxWatchlists: Infinity, maxWatchlistItems: Infinity },
};

async function getUserTier(userId: string): Promise<"free" | "basic"> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionStatus: true },
  });
  if (
    user?.subscriptionStatus === "active" &&
    user?.subscriptionTier === "basic"
  ) {
    return "basic";
  }
  return "free";
}

export async function handleCreateWatchlist(
  rawInput: unknown
): Promise<CreateWatchlistOutput> {
  const input: CreateWatchlistInput =
    CreateWatchlistInputSchema.parse(rawInput);

  // Check subscription limits
  const tier = await getUserTier(input.userId);
  const limits = TIER_LIMITS[tier];

  // Count existing watchlists
  const watchlistCount = await prisma.watchlist.count({
    where: { userId: input.userId },
  });

  if (watchlistCount >= limits.maxWatchlists) {
    return {
      watchlistId: "",
      name: input.name,
      tickers: [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      error: `You've reached your limit of ${limits.maxWatchlists} watchlists. Upgrade to Basic for unlimited watchlists!`,
    };
  }

  // Cap tickers to limit
  const tickersToAdd = input.tickers
    ? input.tickers.slice(0, limits.maxWatchlistItems)
    : [];

  // Create the watchlist with capped tickers
  const watchlist = await prisma.watchlist.create({
    data: {
      userId: input.userId,
      name: input.name,
      isFavorite: input.setAsFavorite ?? false,
      items:
        tickersToAdd.length > 0
          ? {
              create: tickersToAdd.map((symbol, index) => ({
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
