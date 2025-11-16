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

function dateToYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Fetch recent news for a symbol using Finnhub.
 * You can swap this out for any provider you like.
 */
export async function getNewsForSymbol(
  symbol: string,
  maxItems = 5
): Promise<NewsItem[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn("FINNHUB_API_KEY not set, skipping news fetch.");
    return [];
  }

  // Last 2 days of news
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 2);

  const url = new URL("https://finnhub.io/api/v1/company-news");
  url.searchParams.set("symbol", symbol.toUpperCase());
  url.searchParams.set("from", dateToYMD(from));
  url.searchParams.set("to", dateToYMD(to));
  url.searchParams.set("token", apiKey);

  const res = await fetch(url.toString(), {
    // Don't cache too aggressively; you want relatively fresh headlines
    next: { revalidate: 300 }, // 5 minutes
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("News fetch error:", res.status, text);
    return [];
  }

  const data = (await res.json()) as any[];

  // Finnhub returns an array of news items. Map to our shape.
  return data.slice(0, maxItems).map((item) => ({
    symbol: symbol.toUpperCase(),
    title: item.headline ?? item.title ?? "",
    summary: item.summary ?? "",
    source: item.source ?? "Unknown",
    publishedAt: item.datetime
      ? new Date(item.datetime * 1000).toISOString()
      : item.datetime ?? new Date().toISOString(),
    relevanceScore: undefined, // Finnhub has an "relevanceScore" on some endpoints; add if available
    sentiment: undefined, // Could be filled later with your own sentiment model
  }));
}
