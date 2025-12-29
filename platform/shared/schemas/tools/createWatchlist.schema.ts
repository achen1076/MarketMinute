import { z } from "zod";

export const CreateWatchlistInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Watchlist name is required").max(50),
  tickers: z
    .array(z.string())
    .optional()
    .describe("Initial tickers to add to the watchlist"),
  setAsFavorite: z
    .boolean()
    .optional()
    .describe("Set this as the user's favorite/active watchlist"),
});

export type CreateWatchlistInput = z.infer<typeof CreateWatchlistInputSchema>;

export const CreateWatchlistOutputSchema = z.object({
  watchlistId: z.string(),
  name: z.string(),
  tickers: z.array(z.string()),
  isFavorite: z.boolean(),
  createdAt: z.string(),
});

export type CreateWatchlistOutput = z.infer<typeof CreateWatchlistOutputSchema>;

export const CreateWatchlistToolSpec = {
  name: "create_watchlist",
  description:
    "Create a new watchlist for the user. Optionally add initial tickers and set as favorite.",
  inputSchema: CreateWatchlistInputSchema,
  outputSchema: CreateWatchlistOutputSchema,
} as const;
