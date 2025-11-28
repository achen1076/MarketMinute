import "server-only";

export type NewsItem = {
  symbol: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string; // ISO
  relevanceScore?: number;
  sentiment?: "positive" | "negative" | "neutral";
};

/**
 * Fetch recent news for a symbol using Financial Modeling Prep.
 */
export async function getNewsForSymbol(
  symbol: string,
  maxItems = 5
): Promise<NewsItem[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.warn("FMP_API_KEY not set, skipping news fetch.");
    return [];
  }

  const url = new URL("https://financialmodelingprep.com/stable/news/stock");
  url.searchParams.set("symbols", symbol.toUpperCase());
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[FMP] News fetch error:", res.status, text);
    return [];
  }

  const data = (await res.json()) as any[];

  if (!Array.isArray(data)) {
    console.error("[FMP] Invalid news response:", data);
    return [];
  }

  return data.slice(0, maxItems).map((item) => ({
    symbol: symbol.toUpperCase(),
    title: item.title ?? "",
    summary: item.text ?? "",
    source: item.site ?? "Unknown",
    publishedAt: item.publishedDate ?? new Date().toISOString(),
    relevanceScore: undefined,
    sentiment: undefined,
  }));
}
