/**
 * Example Next.js API integration for sentiment scoring
 *
 * Place this in: webapp/app/api/sentiment/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SENTIMENT_SERVICE_URL =
  process.env.SENTIMENT_SERVICE_URL || "http://localhost:8001";

interface SentimentScore {
  score: number;
  category: string;
}

interface BatchSentimentResult {
  results: SentimentScore[];
}

/**
 * Score sentiment for a single text
 */
export async function POST(request: NextRequest) {
  try {
    const { text, ticker, saveToDb } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Call sentiment service
    const response = await fetch(`${SENTIMENT_SERVICE_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Sentiment service error: ${response.statusText}`);
    }

    const sentiment: SentimentScore = await response.json();

    // Optionally save to database
    if (saveToDb && ticker) {
      await prisma.newsItem.create({
        data: {
          ticker,
          headline: text,
          sentiment: sentiment.score,
          category: sentiment.category,
        },
      });
    }

    return NextResponse.json(sentiment);
  } catch (error) {
    console.error("Sentiment scoring error:", error);
    return NextResponse.json(
      { error: "Failed to score sentiment" },
      { status: 500 }
    );
  }
}

/**
 * Score sentiment for multiple texts in batch
 */
export async function PUT(request: NextRequest) {
  try {
    const { texts, ticker, saveToDb } = await request.json();

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json(
        { error: "Texts array is required" },
        { status: 400 }
      );
    }

    // Call sentiment service with batch endpoint
    const response = await fetch(`${SENTIMENT_SERVICE_URL}/score-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`Sentiment service error: ${response.statusText}`);
    }

    const batchResult: BatchSentimentResult = await response.json();

    // Optionally save to database
    if (saveToDb && ticker) {
      await prisma.newsItem.createMany({
        data: texts.map((text, idx) => ({
          ticker,
          headline: text,
          sentiment: batchResult.results[idx].score,
          category: batchResult.results[idx].category,
        })),
      });
    }

    return NextResponse.json(batchResult);
  } catch (error) {
    console.error("Batch sentiment scoring error:", error);
    return NextResponse.json(
      { error: "Failed to score batch sentiment" },
      { status: 500 }
    );
  }
}

/**
 * Example usage in your components or pages
 */

// Single text scoring
async function scoreHeadline(headline: string, ticker: string) {
  const response = await fetch("/api/sentiment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: headline,
      ticker,
      saveToDb: true,
    }),
  });

  const { score, category } = await response.json();
  console.log(`Sentiment: ${score.toFixed(4)} (${category})`);
  return { score, category };
}

// Batch scoring for multiple headlines
async function scoreMultipleHeadlines(headlines: string[], ticker: string) {
  const response = await fetch("/api/sentiment", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: headlines,
      ticker,
      saveToDb: true,
    }),
  });

  const { results } = await response.json();
  return results;
}

// Example: Process news when fetched
async function processNewsWithSentiment(ticker: string) {
  // Fetch news from your news API
  const newsItems = await fetchNewsForTicker(ticker);

  // Extract headlines
  const headlines = newsItems.map((item) => item.headline);

  // Score all headlines in batch
  const sentiments = await scoreMultipleHeadlines(headlines, ticker);

  // Combine news with sentiment scores
  const enrichedNews = newsItems.map((item, idx) => ({
    ...item,
    sentiment: sentiments[idx].score,
    sentimentCategory: sentiments[idx].category,
  }));

  return enrichedNews;
}

// Helper function (placeholder - implement based on your news source)
async function fetchNewsForTicker(ticker: string) {
  // Implement your news fetching logic
  return [];
}
