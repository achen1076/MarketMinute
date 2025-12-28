import {
  GetTickerNewsInputSchema,
  GetTickerNewsOutputSchema,
  GetTickerNewsToolSpec,
  type GetTickerNewsInput,
  type GetTickerNewsOutput,
} from "@/shared/schemas/tools/getTickerNews.schema";

import { prisma } from "../../ops/dbcache";
import { nowIso } from "../../ops/time";

export async function handleGetTickerNews(
  rawInput: unknown
): Promise<GetTickerNewsOutput> {
  const input: GetTickerNewsInput = GetTickerNewsInputSchema.parse(rawInput);

  const tickers = input.tickers.map((t) => t.toUpperCase());

  const newsItems = await prisma.newsItem.findMany({
    where: { ticker: { in: tickers } },
    orderBy: { createdAt: "desc" },
    take: input.limit * tickers.length,
  });

  const output: GetTickerNewsOutput = {
    news: newsItems.slice(0, input.limit).map((n) => ({
      id: n.id,
      ticker: n.ticker,
      headline: n.headline,
      summary: n.summary ?? undefined,
      sentiment: n.sentiment,
      relevance: n.relevance,
      category: n.category ?? undefined,
      createdAt: n.createdAt.toISOString(),
    })),
    asOf: nowIso(),
  };

  GetTickerNewsOutputSchema.parse(output);
  return output;
}

export const getTickerNewsTool = {
  ...GetTickerNewsToolSpec,
  handler: handleGetTickerNews,
} as const;
