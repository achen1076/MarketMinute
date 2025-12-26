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

export async function POST() {
  try {
    // Get user session (required for rate limiting)
    const session = await auth();

    // Rate limiting: 3 requests per 5 minutes per user
    const identifier = session?.user?.email || "anonymous";
    const rateLimitResult = checkRateLimit(
      "sentinel",
      identifier,
      RateLimitPresets.AI_SENTINEL
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
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
