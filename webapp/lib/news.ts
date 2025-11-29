import "server-only";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

export type NewsItem = {
  symbol: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  relevanceScore?: number;
  sentiment?: "positive" | "negative" | "neutral";
};

// Zod schema for news analysis
const newsAnalysisSchema = z.object({
  articles: z.array(
    z.object({
      index: z
        .number()
        .describe("The index of the article in the original array"),
      relevanceScore: z
        .number()
        .min(0)
        .max(1)
        .describe(
          "Score from 0-1 indicating how relevant/impactful this news is to the stock price movement. 1 = highly impactful (earnings, mergers, lawsuits), 0 = not relevant"
        ),
      sentiment: z
        .enum(["positive", "negative", "neutral"])
        .describe(
          "Overall sentiment of the article: positive (good news for stock), negative (bad news for stock), or neutral"
        ),
      reasoning: z
        .string()
        .describe("Brief explanation of the relevance score and sentiment"),
    })
  ),
});

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

/**
 * Analyze news articles for relevance and sentiment using AI.
 * Returns the same articles with relevanceScore and sentiment populated.
 */
export async function analyzeNewsImpact(
  articles: NewsItem[],
  symbol: string,
  changePct?: number
): Promise<NewsItem[]> {
  if (articles.length === 0) {
    return articles;
  }

  const model = new ChatOpenAI({
    model: "gpt-5-mini",
  });

  const structuredModel = model.withStructuredOutput(newsAnalysisSchema);

  const systemPrompt = `
You are a financial news analyst. Analyze the provided news articles for a stock ticker.

For each article, determine:
1. **Relevance Score (0-1)**: How impactful is this news to the stock price?
   - 1.0: Major events (earnings beats/misses, M&A, lawsuits, executive changes, product launches)
   - 0.7-0.9: Significant developments (partnerships, regulatory news, analyst upgrades/downgrades)
   - 0.4-0.6: Moderate relevance (industry trends, competitive news)
   - 0.1-0.3: Low relevance (generic mentions, tangential news)
   - 0.0: Not relevant

2. **Sentiment**: positive (good for stock), negative (bad for stock), or neutral
   - positive: Good earnings, partnerships, growth, positive analyst coverage
   - negative: Lawsuits, losses, regulatory issues, downgrades, controversies
   - neutral: Factual announcements without clear positive/negative impact

Be objective and base your analysis on the content provided.
`.trim();

  const userMessage = `
Symbol: ${symbol}
Current Price Change: ${
    changePct !== undefined ? `${changePct.toFixed(2)}%` : "N/A"
  }

Articles to analyze:
${articles
  .map(
    (article, idx) => `
[${idx}] Title: ${article.title}
Summary: ${article.summary}
Published: ${article.publishedAt}
`
  )
  .join("\n")}
`.trim();

  try {
    const result = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ]);

    // Map the analysis back to the articles
    const analyzedArticles = articles.map((article, idx) => {
      const analysis = result.articles.find((a) => a.index === idx);
      if (analysis) {
        return {
          ...article,
          relevanceScore: analysis.relevanceScore,
          sentiment: analysis.sentiment,
        };
      }
      return article;
    });

    // Sort by relevance score (highest first)
    return analyzedArticles.sort(
      (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
    );
  } catch (error) {
    console.error("Error analyzing news impact:", error);
    return articles;
  }
}

/**
 * Fetch and analyze news for a symbol.
 * This is a convenience method that combines fetching and analysis.
 */
export async function getAnalyzedNewsForSymbol(
  symbol: string,
  changePct?: number,
  maxItems = 5
): Promise<NewsItem[]> {
  const news = await getNewsForSymbol(symbol, maxItems);
  return analyzeNewsImpact(news, symbol, changePct);
}
