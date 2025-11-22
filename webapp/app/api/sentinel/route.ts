import { NextResponse } from "next/server";
import { runSentinelAgent } from "@/agents/sentinel/agent/loop";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST() {
  try {
    const { context, report } = await runSentinelAgent();

    // Get user session (optional)
    const session = await auth();

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

    return NextResponse.json({
      ok: true,
      report,
      reportId: savedReport.id,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Sentinel] Error generating report:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate Sentinel report" },
      { status: 500 }
    );
  }
}
