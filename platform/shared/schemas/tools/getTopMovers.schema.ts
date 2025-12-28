import { z } from "zod";

export const GetTopMoversInputSchema = z.object({
  userId: z.string().describe("The user ID to fetch watchlists for"),
  watchlistId: z.string().optional(),
  watchlistName: z.string().optional(),
  direction: z.enum(["gainers", "losers"]),
  limit: z.number().int().min(1).max(50).optional().default(5),
});

export type GetTopMoversInput = z.infer<typeof GetTopMoversInputSchema>;

export const TopMoverItemSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changePct: z.number(),
  volume: z.number().optional(),
});

export const GetTopMoversOutputSchema = z.object({
  watchlist: z.string(),
  direction: z.enum(["gainers", "losers"]),
  movers: z.array(TopMoverItemSchema),
  asOf: z.string(),
});

export type GetTopMoversOutput = z.infer<typeof GetTopMoversOutputSchema>;

export const GetTopMoversToolSpec = {
  name: "get_top_movers",
  description:
    "Get the top gainers or losers from a watchlist, pre-sorted by percentage change.",
  inputSchema: GetTopMoversInputSchema,
  outputSchema: GetTopMoversOutputSchema,
} as const;
