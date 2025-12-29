import {
  EditWatchlistInputSchema,
  EditWatchlistOutputSchema,
  EditWatchlistToolSpec,
  type EditWatchlistInput,
  type EditWatchlistOutput,
} from "@/shared/schemas/tools/editWatchlist.schema";

import { prisma } from "../../ops/dbcache";

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
        const existingSymbols = new Set(currentTickers);
        const newTickers = input.tickers
          .map((t) => t.toUpperCase())
          .filter((t) => !existingSymbols.has(t));

        if (newTickers.length > 0) {
          const maxOrder = Math.max(...watchlist.items.map((i) => i.order), -1);
          await prisma.watchlistItem.createMany({
            data: newTickers.map((symbol, index) => ({
              watchlistId: input.watchlistId,
              symbol,
              order: maxOrder + 1 + index,
            })),
          });
          currentTickers = [...currentTickers, ...newTickers];
          message = `Added ${newTickers.length} ticker(s): ${newTickers.join(
            ", "
          )}`;
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
      await prisma.watchlist.updateMany({
        where: { userId: input.userId, isFavorite: true },
        data: { isFavorite: false },
      });
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
