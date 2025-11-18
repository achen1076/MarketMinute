// app/api/generate-summaries/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSnapshotsForSymbols } from "@/lib/marketData";
import { buildSummary } from "@/lib/summary";

/**
 * Generate daily summaries for all watchlists
 * POST /api/generate-summaries?date=YYYY-MM-DD&secret=YOUR_SECRET
 * 
 * This can be called from a cron job
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const dateParam = searchParams.get("date");

  // Simple auth check for cron jobs
  const expectedSecret = process.env.CRON_SECRET || "change-me-in-production";
  if (secret !== expectedSecret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const targetDate = dateParam ? new Date(dateParam) : new Date();
  const dateOnly = targetDate.toISOString().split("T")[0];

  console.log(`[GenerateSummaries] Generating summaries for ${dateOnly}...`);

  try {
    // Get all watchlists
    const watchlists = await prisma.watchlist.findMany({
      include: {
        items: true,
      },
    });

    console.log(`[GenerateSummaries] Found ${watchlists.length} watchlists`);

    const results = [];

    for (const watchlist of watchlists) {
      if (watchlist.items.length === 0) {
        console.log(`[GenerateSummaries] Skipping empty watchlist: ${watchlist.name}`);
        continue;
      }

      console.log(`[GenerateSummaries] Processing: ${watchlist.name}`);

      const symbols = watchlist.items.map((item) => item.symbol);
      const snapshots = await getSnapshotsForSymbols(symbols);

      if (snapshots.length === 0) {
        console.log(`[GenerateSummaries] No snapshots for: ${watchlist.name}`);
        continue;
      }

      // Calculate stats
      const avgChangePct =
        snapshots.reduce((sum, s) => sum + s.changePct, 0) / snapshots.length;

      const sorted = [...snapshots].sort((a, b) => b.changePct - a.changePct);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      // Generate full summary
      const fullSummary = await buildSummary(watchlist.name, snapshots);

      // Create short summary text
      const direction =
        avgChangePct > 0.5
          ? "gains"
          : avgChangePct < -0.5
          ? "declines"
          : "mixed trading";

      const leader =
        Math.abs(best.changePct) > Math.abs(worst.changePct)
          ? `${best.symbol} led gains`
          : `${worst.symbol} led declines`;

      const summaryText = `${direction}, ${leader}`.replace(/^./, (c) =>
        c.toUpperCase()
      );

      // Upsert to database
      const summary = await prisma.dailyWatchlistSummary.upsert({
        where: {
          watchlistId_date: {
            watchlistId: watchlist.id,
            date: new Date(dateOnly),
          },
        },
        create: {
          watchlistId: watchlist.id,
          date: new Date(dateOnly),
          avgChangePct,
          bestPerformer: best.symbol,
          bestChangePct: best.changePct,
          worstPerformer: worst.symbol,
          worstChangePct: worst.changePct,
          summaryText,
          fullSummary: JSON.stringify(fullSummary),
        },
        update: {
          avgChangePct,
          bestPerformer: best.symbol,
          bestChangePct: best.changePct,
          worstPerformer: worst.symbol,
          worstChangePct: worst.changePct,
          summaryText,
          fullSummary: JSON.stringify(fullSummary),
        },
      });

      results.push({
        watchlistId: watchlist.id,
        watchlistName: watchlist.name,
        avgChangePct,
        summaryText,
      });

      console.log(
        `[GenerateSummaries] ✓ ${watchlist.name}: ${avgChangePct.toFixed(2)}% - ${summaryText}`
      );
    }

    return NextResponse.json({
      success: true,
      date: dateOnly,
      summaries: results,
    });
  } catch (error) {
    console.error("[GenerateSummaries] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate summaries" },
      { status: 500 }
    );
  }
}
