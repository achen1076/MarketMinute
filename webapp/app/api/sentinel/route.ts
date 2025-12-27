import { NextResponse } from "next/server";
import { runSentinelAgent } from "@/agents/sentinel/agent/loop";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const session = await auth();

    const identifier = session?.user?.email || "anonymous";
    const rateLimitResult = checkRateLimit(
      "sentinel",
      identifier,
      RateLimitPresets.AI_SENTINEL
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Check if a report already exists for today (unless force=true)
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    if (!force) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingReport = await prisma.sentinelReport.findFirst({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingReport) {
        return NextResponse.json(
          {
            ok: true,
            skipped: true,
            reason: "Report already exists for today",
            reportId: existingReport.id,
            timestamp: existingReport.createdAt.toISOString(),
          },
          { headers: getRateLimitHeaders(rateLimitResult) }
        );
      }
    }

    const { context, report } = await runSentinelAgent();

    // Save to database
    const savedReport = await prisma.sentinelReport.create({
      data: {
        summary: report.summary,
        keyDrivers: report.keyDrivers,
        macroContext: report.macroContext,
        whatThisMeans: report.whatThisMeans ?? undefined,

        // Anomaly flags
        indexMove: context.anomalies.indexMove,
        sectorRotation: context.anomalies.sectorRotation,
        macroSurprise: context.anomalies.macroSurprise,
        volSpike: context.anomalies.volSpike,

        // Market snapshot
        vix: context.volatility.vix,
        vixChangePct: context.volatility.vixChangePct,
        realizedVol: context.volatility.realizedVol,

        // Store full context for reprocessing
        context: context as any,

        userId: session?.user?.id || null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        report,
        reportId: savedReport.id,
        timestamp: new Date().toISOString(),
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (err) {
    console.error("[Sentinel] Error generating report:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate Sentinel report" },
      { status: 500 }
    );
  }
}
