import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAndCreateSentimentAlerts } from "@shared/lib/sentimentAlerts";

const ADMIN_EMAIL = "achen1076@gmail.com";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { watchlistId } = await req.json();

    if (!watchlistId) {
      return NextResponse.json(
        { error: "watchlistId is required" },
        { status: 400 }
      );
    }

    // Get symbols from the selected watchlist
    const watchlist = await prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: { items: { select: { symbol: true } } },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    const symbols = watchlist.items.map(
      (item: { symbol: string }) => item.symbol
    );
    console.log(
      `[TestSentimentAlerts] Testing ${symbols.length} symbols from watchlist "${watchlist.name}"`
    );

    let symbolsAnalyzed = 0;
    let totalAlerts = 0;

    // Get today's date for filtering recent news
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each symbol using news from database
    for (const symbol of symbols) {
      try {
        // Get recent news items from database (last 24 hours)
        const recentNews = await prisma.newsItem.findMany({
          where: {
            ticker: symbol.toUpperCase(),
            createdAt: { gte: today },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        if (recentNews.length === 0) {
          console.log(`[TestSentimentAlerts] No recent news for ${symbol}`);
          continue;
        }

        // Calculate average sentiment from stored news
        const avgSentiment =
          recentNews.reduce((sum, n) => sum + n.sentiment, 0) /
          recentNews.length;

        const alertCreated = await checkAndCreateSentimentAlerts(
          symbol,
          avgSentiment,
          recentNews.length
        );
        if (alertCreated) totalAlerts++;
        symbolsAnalyzed++;
        console.log(
          `[TestSentimentAlerts] ${symbol}: sentiment=${avgSentiment.toFixed(
            2
          )}, newsCount=${recentNews.length}, alertCreated=${alertCreated}`
        );
      } catch (error) {
        console.error(`[TestSentimentAlerts] Error for ${symbol}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      symbolsAnalyzed,
      alertsCreated: totalAlerts,
    });
  } catch (error) {
    console.error("[TestSentimentAlerts] Error:", error);
    return NextResponse.json(
      { error: "Failed to test sentiment alerts" },
      { status: 500 }
    );
  }
}
