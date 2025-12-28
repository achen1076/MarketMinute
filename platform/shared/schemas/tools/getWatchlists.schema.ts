import { z } from "zod";

export const GetWatchlistsInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type GetWatchlistsInput = z.infer<typeof GetWatchlistsInputSchema>;

export const WatchlistItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  isFavorite: z.boolean(),
  tickers: z.array(z.string()),
});

export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;

export const GetWatchlistsOutputSchema = z.object({
  watchlists: z.array(WatchlistItemSchema),
  userId: z.string(),
  asOf: z.string(),
});

export type GetWatchlistsOutput = z.infer<typeof GetWatchlistsOutputSchema>;

export const GetWatchlistsToolSpec = {
  name: "get_watchlists",
  description:
    "Get the user's watchlists with their ticker symbols. Use this to see what stocks the user is tracking.",
  inputSchema: GetWatchlistsInputSchema,
  outputSchema: GetWatchlistsOutputSchema,
} as const;
