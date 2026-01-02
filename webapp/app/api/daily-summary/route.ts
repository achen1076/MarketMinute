// app/api/daily-summary/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTickerCacheTTL } from "@/lib/marketHours";

/**
 * Get the last 7 daily summaries for a watchlist
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const watchlistId = searchParams.get("watchlistId");
    const days = parseInt(searchParams.get("days") || "7");

    if (!watchlistId) {
      return NextResponse.json(
        { error: "watchlistId required" },
        { status: 400 }
      );
    }

    const summaries = await prisma.dailyWatchlistSummary.findMany({
      where: { watchlistId },
      orderBy: { date: "desc" },
      take: days,
    });

    const cacheTTL = getTickerCacheTTL(5);

    return NextResponse.json(
      { summaries },
      {
        headers: {
          "Cache-Control": `public, max-age=${cacheTTL}`,
        },
      }
    );
  } catch (error) {
    console.error("[DailySummary] Error fetching summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 }
    );
  }
}

/**
 * Create or update today's daily summary for a watchlist
 * This should be called daily (via cron or manually)
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { watchlistId, date, data } = body as {
      watchlistId: string;
      date: string; // YYYY-MM-DD
      data: {
        avgChangePct: number;
        bestPerformer?: string;
        bestChangePct?: number;
        worstPerformer?: string;
        worstChangePct?: number;
        summaryText: string;
        fullSummary?: any;
      };
    };

    if (!watchlistId || !date || !data) {
      return NextResponse.json(
        { error: "watchlistId, date, and data required" },
        { status: 400 }
      );
    }

    const summary = await prisma.dailyWatchlistSummary.upsert({
      where: {
        watchlistId_date: {
          watchlistId,
          date: new Date(date),
        },
      },
      create: {
        watchlistId,
        date: new Date(date),
        avgChangePct: data.avgChangePct,
        bestPerformer: data.bestPerformer,
        bestChangePct: data.bestChangePct,
        worstPerformer: data.worstPerformer,
        worstChangePct: data.worstChangePct,
        summaryText: data.summaryText,
        fullSummary: data.fullSummary ? JSON.stringify(data.fullSummary) : null,
      },
      update: {
        avgChangePct: data.avgChangePct,
        bestPerformer: data.bestPerformer,
        bestChangePct: data.bestChangePct,
        worstPerformer: data.worstPerformer,
        worstChangePct: data.worstChangePct,
        summaryText: data.summaryText,
        fullSummary: data.fullSummary ? JSON.stringify(data.fullSummary) : null,
      },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[DailySummary] Error creating/updating summary:", error);
    return NextResponse.json(
      { error: "Failed to create/update summary" },
      { status: 500 }
    );
  }
}
