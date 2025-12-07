import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Request validation schema
const ProcessNewsSchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  ticker: z.string().min(1, "Ticker is required"),
  date: z.string().optional(),
  url: z.string().url().optional(),
});

// Service URLs (configure via environment variables)
const SENTIMENT_SERVICE_URL =
  process.env.SENTIMENT_SERVICE_URL || "http://localhost:8001";
const RELEVANCE_SERVICE_URL =
  process.env.RELEVANCE_SERVICE_URL || "http://localhost:8002";

interface SentimentResponse {
  score: number;
  category: string;
}

interface RelevanceResponse {
  score: number;
  category: string;
}

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { headline, ticker, date, url } = ProcessNewsSchema.parse(body);

    // Call sentiment service
    console.log(
      `📊 Calling sentiment service for: ${headline.substring(0, 50)}...`
    );
    const sentimentRes = await fetch(`${SENTIMENT_SERVICE_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: headline }),
    });

    if (!sentimentRes.ok) {
      throw new Error(`Sentiment service error: ${sentimentRes.statusText}`);
    }

    const sentimentData: SentimentResponse = await sentimentRes.json();

    // Call relevance service
    console.log(`🎯 Calling relevance service for: ${ticker}`);
    const relevanceRes = await fetch(`${RELEVANCE_SERVICE_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline, ticker }),
    });

    if (!relevanceRes.ok) {
      throw new Error(`Relevance service error: ${relevanceRes.statusText}`);
    }

    const relevanceData: RelevanceResponse = await relevanceRes.json();

    // Combine results and store in database
    const newsItem = await prisma.newsItem.create({
      data: {
        ticker,
        headline,
        sentiment: sentimentData.score,
        relevance: relevanceData.score,
        category: relevanceData.category,
        createdAt: date ? new Date(date) : new Date(),
      },
    });

    console.log(`✅ News item stored: ${newsItem.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: newsItem.id,
        ticker,
        headline,
        sentiment: sentimentData.score,
        sentimentCategory: sentimentData.category,
        relevance: relevanceData.score,
        relevanceCategory: relevanceData.category,
        createdAt: newsItem.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error processing news:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to process news", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve processed news
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = ticker ? { ticker } : {};

    const newsItems = await prisma.newsItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: newsItems,
      count: newsItems.length,
    });
  } catch (error) {
    console.error("❌ Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news items" },
      { status: 500 }
    );
  }
}
