import { NextResponse } from "next/server";
import { processSentimentAlertsForSymbols } from "@shared/lib/sentimentAlerts";
import { prisma } from "@/lib/prisma";

const LAMBDA_API_KEY = process.env.LAMBDA_API_KEY;

export async function POST(req: Request) {
  // Verify API key for cron jobs
  const apiKey = req.headers.get("x-api-key");
  if (LAMBDA_API_KEY && apiKey !== LAMBDA_API_KEY) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Option 1: Process specific symbols with sentiment data from Lambda
    if (body.symbols && Array.isArray(body.symbols)) {
      const result = await processSentimentAlertsForSymbols(body.symbols);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Option 2: Calculate sentiment from NewsItem table in database
    const uniqueSymbols = await prisma.watchlistItem.findMany({
      select: { symbol: true },
      distinct: ["symbol"],
    });

    const symbols = uniqueSymbols.map((s) => s.symbol);
    console.log(
      `[SentimentAlerts] Processing ${symbols.length} unique symbols`
    );

    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const symbolSentiments: Array<{
      symbol: string;
      sentiment: number;
      newsCount: number;
    }> = [];

    for (const symbol of symbols) {
      try {
        // Get recent news from database
        const recentNews = await prisma.newsItem.findMany({
          where: {
            ticker: symbol.toUpperCase(),
            createdAt: { gte: today },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        if (recentNews.length === 0) continue;

        // Calculate average sentiment from stored news
        const avgSentiment =
          recentNews.reduce((sum, n) => sum + n.sentiment, 0) /
          recentNews.length;

        symbolSentiments.push({
          symbol,
          sentiment: avgSentiment,
          newsCount: recentNews.length,
        });
      } catch (error) {
        console.error(`[SentimentAlerts] Error processing ${symbol}:`, error);
      }
    }

    // Process alerts for all symbols
    const result = await processSentimentAlertsForSymbols(symbolSentiments);

    return NextResponse.json({
      success: true,
      symbolsAnalyzed: symbolSentiments.length,
      ...result,
    });
  } catch (error) {
    console.error("[SentimentAlerts] Error:", error);
    return NextResponse.json(
      { error: "Failed to process sentiment alerts" },
      { status: 500 }
    );
  }
}
