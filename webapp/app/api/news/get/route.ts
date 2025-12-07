import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get news items for a ticker from database
 * GET /api/news/get?ticker=AAPL&days=2
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get("ticker");
    const days = parseInt(searchParams.get("days") || "2");

    if (!ticker) {
      return NextResponse.json(
        { error: "ticker is required" },
        { status: 400 }
      );
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const newsItems = await prisma.newsItem.findMany({
      where: {
        ticker: ticker.toUpperCase(),
        createdAt: {
          gte: since,
        },
        NOT: [{ sentiment: null }, { relevance: null }],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      ok: true,
      ticker,
      count: newsItems.length,
      news: newsItems.map((item) => ({
        sentiment: item.sentiment,
        relevance: item.relevance,
        category: item.category,
        headline: item.headline,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
