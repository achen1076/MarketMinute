import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  storeTickerNewsTraining,
  storeGeneralNewsTraining,
  getTrainingDataStats,
} from "@/lib/trainingDataDb";

/**
 * POST /api/training-data
 * Store training data (ticker news and general news)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickerNews, generalNews } = body;

    if (!tickerNews && !generalNews) {
      return NextResponse.json(
        { error: "No training data provided" },
        { status: 400 }
      );
    }

    let tickerCount = 0;
    let generalCount = 0;

    // Store ticker news training data
    if (tickerNews && Array.isArray(tickerNews) && tickerNews.length > 0) {
      const formattedTickerData = tickerNews.map((item: any) => ({
        date: new Date(item.date),
        ticker: item.ticker,
        headline: item.headline,
        newsUrl: item.newsUrl || undefined,
        stockChangePct: item.stockChangePct,
        dowChangePct: item.dowChangePct,
        spChangePct: item.spChangePct,
        nasdaqChangePct: item.nasdaqChangePct,
      }));

      tickerCount = await storeTickerNewsTraining(formattedTickerData);
    }

    // Store general news training data
    if (generalNews && Array.isArray(generalNews) && generalNews.length > 0) {
      const formattedGeneralData = generalNews.map((item: any) => ({
        date: new Date(item.date),
        headline: item.headline,
        newsUrl: item.newsUrl || undefined,
        dowChangePct: item.dowChangePct,
        spChangePct: item.spChangePct,
        nasdaqChangePct: item.nasdaqChangePct,
      }));

      generalCount = await storeGeneralNewsTraining(formattedGeneralData);
    }

    return NextResponse.json({
      success: true,
      tickerCount,
      generalCount,
      totalCount: tickerCount + generalCount,
    });
  } catch (error) {
    console.error("Error storing training data:", error);
    return NextResponse.json(
      {
        error: "Failed to store training data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/training-data
 * Get statistics about training data
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const stats = await getTrainingDataStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching training data stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch training data stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
