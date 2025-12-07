import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get news items for Lambda function (uses API key auth instead of session)
 * GET /api/news/get-for-lambda?ticker=AAPL&days=2&apiKey=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get("ticker");
    const days = parseInt(searchParams.get("days") || "2");
    const apiKey = searchParams.get("apiKey");

    // Verify API key for Lambda
    const expectedKey = process.env.LAMBDA_API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      ok: true,
      ticker,
      news: newsItems,
    });
  } catch (err) {
    console.error("[News] Error fetching news:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
