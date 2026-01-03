import {
  EditWatchlistInputSchema,
  EditWatchlistOutputSchema,
  EditWatchlistToolSpec,
  type EditWatchlistInput,
  type EditWatchlistOutput,
} from "@/shared/schemas/tools/editWatchlist.schema";

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

export async function handleEditWatchlist(
  rawInput: unknown
): Promise<EditWatchlistOutput> {
  const input: EditWatchlistInput = EditWatchlistInputSchema.parse(rawInput);

  // Verify ownership
  const watchlist = await prisma.watchlist.findFirst({
    where: { id: input.watchlistId, userId: input.userId },
    include: { items: true },
  });

  if (!watchlist) {
    return {
      success: false,
      watchlistId: input.watchlistId,
      action: input.action,
      message: "Watchlist not found or access denied",
    };
  }

  let message = "";
  let currentTickers: string[] = watchlist.items.map((i) => i.symbol);

  switch (input.action) {
    case "add_tickers":
      if (input.tickers && input.tickers.length > 0) {
        // Check subscription limits
        const tier = await getUserTier(input.userId);
        const limits = TIER_LIMITS[tier];
        const currentCount = watchlist.items.length;

        if (currentCount >= limits.maxWatchlistItems) {
          return {
            success: false,
            watchlistId: input.watchlistId,
            action: input.action,
            message: `You've reached your limit of ${limits.maxWatchlistItems} tickers per watchlist. Upgrade to Basic for unlimited tickers!`,
            currentTickers,
          };
        }

        const existingSymbols = new Set(currentTickers);
        const newTickers = input.tickers
          .map((t) => t.toUpperCase())
          .filter((t) => !existingSymbols.has(t));

        // Cap to remaining slots
        const remainingSlots = limits.maxWatchlistItems - currentCount;
        const tickersToAdd = newTickers.slice(0, remainingSlots);

        if (tickersToAdd.length > 0) {
          const maxOrder = Math.max(...watchlist.items.map((i) => i.order), -1);
          await prisma.watchlistItem.createMany({
            data: tickersToAdd.map((symbol, index) => ({
              watchlistId: input.watchlistId,
              symbol,
              order: maxOrder + 1 + index,
            })),
          });
          currentTickers = [...currentTickers, ...tickersToAdd];

          if (tickersToAdd.length < newTickers.length) {
            message = `Added ${
              tickersToAdd.length
            } ticker(s): ${tickersToAdd.join(", ")}. ${
              newTickers.length - tickersToAdd.length
            } ticker(s) not added due to limit.`;
          } else {
            message = `Added ${
              tickersToAdd.length
            } ticker(s): ${tickersToAdd.join(", ")}`;
          }
        } else {
          message = "All tickers already exist in watchlist";
        }
      }
      break;

    case "remove_tickers":
      if (input.tickers && input.tickers.length > 0) {
        const tickersToRemove = input.tickers.map((t) => t.toUpperCase());
        await prisma.watchlistItem.deleteMany({
          where: {
            watchlistId: input.watchlistId,
            symbol: { in: tickersToRemove },
          },
        });
        currentTickers = currentTickers.filter(
          (t) => !tickersToRemove.includes(t)
        );
        message = `Removed ticker(s): ${tickersToRemove.join(", ")}`;
      }
      break;

    case "rename":
      if (input.newName) {
        await prisma.watchlist.update({
          where: { id: input.watchlistId },
          data: { name: input.newName },
        });
        message = `Renamed watchlist to "${input.newName}"`;
      }
      break;

    case "set_favorite":
      await prisma.watchlist.update({
        where: { id: input.watchlistId },
        data: { isFavorite: true },
      });
      message = `Set "${watchlist.name}" as favorite watchlist`;
      break;

    case "delete":
      await prisma.watchlist.delete({
        where: { id: input.watchlistId },
      });
      message = `Deleted watchlist "${watchlist.name}"`;
      currentTickers = [];
      break;
  }

  const output: EditWatchlistOutput = {
    success: true,
    watchlistId: input.watchlistId,
    action: input.action,
    message,
    currentTickers: input.action !== "delete" ? currentTickers : undefined,
  };

  EditWatchlistOutputSchema.parse(output);
  return output;
}

export const editWatchlistTool = {
  ...EditWatchlistToolSpec,
  handler: handleEditWatchlist,
} as const;
