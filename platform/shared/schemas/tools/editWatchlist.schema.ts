import { z } from "zod";

export const EditWatchlistInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  watchlistId: z.string().min(1, "Watchlist ID is required"),
  action: z.enum([
    "add_tickers",
    "remove_tickers",
    "rename",
    "set_favorite",
    "delete",
  ]),
  tickers: z
    .array(z.string())
    .optional()
    .describe(
      "Tickers to add or remove (for add_tickers/remove_tickers actions)"
    ),
  newName: z
    .string()
    .optional()
    .describe("New name for the watchlist (for rename action)"),
});

export type EditWatchlistInput = z.infer<typeof EditWatchlistInputSchema>;

export const EditWatchlistOutputSchema = z.object({
  success: z.boolean(),
  watchlistId: z.string(),
  action: z.string(),
  message: z.string(),
  currentTickers: z.array(z.string()).optional(),
});

export type EditWatchlistOutput = z.infer<typeof EditWatchlistOutputSchema>;

export const EditWatchlistToolSpec = {
  name: "edit_watchlist",
  description:
    "Edit an existing watchlist. Actions: add_tickers, remove_tickers, rename, set_favorite, delete.",
  inputSchema: EditWatchlistInputSchema,
  outputSchema: EditWatchlistOutputSchema,
} as const;
