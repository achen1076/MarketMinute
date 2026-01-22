import "server-only";
import { prisma } from "@/lib/prisma";
import { shouldSummarize, summarizeArticle } from "@shared/lib/articleSummarizer";

export type NewsItem = {
  symbol: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url?: string;
  relevanceScore?: number;
  sentimentScore?: number;
  sentiment?: "positive" | "negative" | "neutral";
};

/**
 * Fetch recent news for a symbol using Financial Modeling Prep.
 */
type FMPNewsItem = {
  symbol: string;
  title: string;
  text: string;
  url: string;
  site: string;
  publishedDate: string;
};

/**
 * Fetch recent news for a symbol using Financial Modeling Prep.
 * Returns raw FMP data for further processing.
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
    url: item.url,
    relevanceScore: undefined,
    sentiment: undefined,
  }));
}

/**
 * Analyze news articles for relevance and sentiment using deployed ML models.
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

  const sentimentUrl = process.env.SENTIMENT_SERVICE_URL;
  const relevanceUrl = process.env.RELEVANCE_SERVICE_URL;

  if (!sentimentUrl || !relevanceUrl) {
    console.warn("ML service URLs not configured, skipping analysis");
    return articles;
  }

  try {
    const analyzedArticles = await Promise.all(
      articles.map(async (article) => {
        try {
          const sentimentRes = await fetch(`${sentimentUrl}/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: article.title }),
          });

          const relevanceRes = await fetch(`${relevanceUrl}/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              headline: article.title,
              ticker: symbol,
            }),
          });

          if (!sentimentRes.ok || !relevanceRes.ok) {
            console.warn(
              `Failed to analyze article: ${article.title.substring(0, 50)}`
            );
            return article;
          }

          const sentimentData = (await sentimentRes.json()) as {
            score: number;
            category: string;
          };
          const relevanceData = (await relevanceRes.json()) as {
            score: number;
            category: string;
          };

          // Map sentiment score to enum
          let sentiment: "positive" | "negative" | "neutral";
          if (sentimentData.score < -0.05) {
            sentiment = "negative";
          } else if (sentimentData.score > 0.05) {
            sentiment = "positive";
          } else {
            sentiment = "neutral";
          }

          return {
            ...article,
            relevanceScore: relevanceData.score,
            sentimentScore: sentimentData.score,
            sentiment,
          };
        } catch (error) {
          console.error(`Error analyzing article: ${article.title}`, error);
          return article;
        }
      })
    );

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
 * Get news from database first (with AI summaries), fallback to FMP API.
 */
export async function getAnalyzedNewsForSymbol(
  symbol: string,
  changePct?: number,
  maxItems = 5
): Promise<NewsItem[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const dbNews = await prisma.newsItem.findMany({
      where: {
        ticker: symbol.toUpperCase(),
        createdAt: { gte: since },
      },
      orderBy: [{ relevance: "desc" }, { createdAt: "desc" }],
      take: maxItems,
    });

    if (dbNews.length > 0) {
      return dbNews.map((item) => ({
        symbol: item.ticker,
        title: item.headline,
        summary: item.summary || "",
        source: "Database",
        publishedAt: item.createdAt.toISOString(),
        relevanceScore: item.relevance,
        sentiment:
          item.sentiment > 0.25
            ? "positive"
            : item.sentiment < -0.25
            ? "negative"
            : "neutral",
      }));
    }
  } catch (error) {
    console.warn("[News] Database fetch failed, falling back to FMP:", error);
  }

  // Fallback: Fetch from FMP, analyze, generate summaries, and save to DB
  const news = await getNewsForSymbol(symbol, maxItems);
  const analyzedNews = await analyzeNewsImpact(news, symbol, changePct);

  // Process and save to DB in background (don't block response)
  processAndSaveNews(analyzedNews, symbol).catch((err) =>
    console.error("[News] Error saving to DB:", err)
  );

  return analyzedNews;
}

/**
 * Process news: generate AI summaries for qualifying articles and save to DB
 */
async function processAndSaveNews(
  articles: NewsItem[],
  symbol: string
): Promise<void> {
  const sentimentUrl = process.env.SENTIMENT_SERVICE_URL;
  const relevanceUrl = process.env.RELEVANCE_SERVICE_URL;

  if (!sentimentUrl || !relevanceUrl) {
    return; // Can't process without ML services
  }

  for (const article of articles) {
    try {
      // Check if already exists in DB
      const existing = await prisma.newsItem.findFirst({
        where: {
          ticker: symbol.toUpperCase(),
          headline: article.title,
        },
      });

      if (existing) {
        continue; // Skip if already in DB
      }

      const relevanceScore = article.relevanceScore ?? 0;
      const sentimentScore = article.sentimentScore ?? 0;

      // Generate AI summary if it meets thresholds
      let aiSummary: string | null = null;
      if (article.url && shouldSummarize(relevanceScore, sentimentScore)) {
        console.log(
          `[News] Generating AI summary for ${symbol}: ${article.title.substring(
            0,
            40
          )}...`
        );
        aiSummary = await summarizeArticle(article.url, article.title, symbol);
      }

      // Save to database
      await prisma.newsItem.create({
        data: {
          ticker: symbol.toUpperCase(),
          headline: article.title,
          sentiment: sentimentScore,
          relevance: relevanceScore,
          category: null,
          summary: aiSummary,
          url: article.url,
          createdAt: new Date(article.publishedAt),
        },
      });

      console.log(
        `[News] Saved to DB: ${symbol} - ${article.title.substring(0, 40)}...`
      );
    } catch (err) {
      console.error(`[News] Error processing article:`, err);
    }
  }
}
