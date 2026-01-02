import "server-only";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RELEVANCE_THRESHOLD = 0.7;
const SENTIMENT_THRESHOLD = 0.3;

/**
 * Fetch and extract article content from a URL
 */
async function fetchArticleContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[ArticleSummarizer] Failed to fetch ${url}: ${response.status}`
      );
      return null;
    }

    const html = await response.text();

    // Basic HTML to text extraction
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

    // Extract text from paragraphs and article tags
    const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      text = articleMatch[1];
    }

    // Remove remaining HTML tags and clean up
    text = text
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // Limit to ~4000 chars to stay within token limits
    if (text.length > 4000) {
      text = text.substring(0, 4000) + "...";
    }

    return text.length > 100 ? text : null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(`[ArticleSummarizer] Timeout fetching ${url}`);
    } else {
      console.error(`[ArticleSummarizer] Error fetching article:`, error);
    }
    return null;
  }
}

/**
 * Generate a concise summary of article content using OpenAI
 */
async function generateSummary(
  articleContent: string,
  headline: string,
  ticker: string
): Promise<string | null> {
  try {
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: `You are a financial news summarizer. Create a concise 3-4 sentence summary of the article that focuses on the key points relevant to ${ticker} stock. Be factual and avoid speculation.`,
        },
        {
          role: "user",
          content: `Headline: ${headline}\n\nArticle content:\n${articleContent}`,
        },
      ],
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
    });

    return response.output_text.trim() || null;
  } catch (error) {
    console.error("[ArticleSummarizer] Error generating summary:", error);
    return null;
  }
}

/**
 * Check if an article should be summarized based on relevance and sentiment
 * Only summarize if highly relevant AND sentiment is strongly positive or negative
 */
export function shouldSummarize(
  relevanceScore: number,
  sentimentScore: number
): boolean {
  const isHighlyRelevant = relevanceScore >= RELEVANCE_THRESHOLD;
  const hasStrongSentiment =
    sentimentScore >= SENTIMENT_THRESHOLD ||
    sentimentScore <= -SENTIMENT_THRESHOLD;
  return isHighlyRelevant && hasStrongSentiment;
}

/**
 * Fetch article and generate AI summary for highly relevant news
 * Returns null if article can't be fetched or summarized
 */
export async function summarizeArticle(
  url: string,
  headline: string,
  ticker: string
): Promise<string | null> {
  console.log(
    `[ArticleSummarizer] Summarizing article for ${ticker}: ${headline.substring(
      0,
      50
    )}...`
  );

  const articleContent = await fetchArticleContent(url);
  if (!articleContent) {
    console.warn(`[ArticleSummarizer] Could not extract content from ${url}`);
    return null;
  }

  const summary = await generateSummary(articleContent, headline, ticker);
  if (summary) {
    console.log(`[ArticleSummarizer] Generated summary for ${ticker}`);
  }

  return summary;
}
