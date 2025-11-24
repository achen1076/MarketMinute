import { NextResponse } from "next/server";
import { runSentinelAgent } from "@/agents/sentinel/agent/loop";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    lambda: null as any,
    sentinel: null as any,
    errors: [] as string[],
  };

  try {
    console.log("[Cron] Starting daily market analysis...");

    // 1. Trigger AWS Lambda for ML Predictions & Forecasts
    try {
      console.log("[Cron] Triggering AWS Lambda for quant analysis...");
      const lambdaRes = await fetch(process.env.AWS_LAMBDA_QUANT_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.AWS_LAMBDA_API_KEY!,
        },
        body: JSON.stringify({
          task: "daily_analysis",
          timestamp: new Date().toISOString(),
        }),
      });

      if (lambdaRes.ok) {
        results.lambda = await lambdaRes.json();
        console.log("[Cron] Lambda triggered successfully");
      } else {
        throw new Error(`Lambda returned ${lambdaRes.status}`);
      }
    } catch (error) {
      const msg = `Lambda trigger failed: ${error}`;
      console.error(`[Cron] ${msg}`);
      results.errors.push(msg);
    }

    // 3. Run Sentinel Analysis
    try {
      console.log("[Cron] Running Sentinel analysis...");
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

          // Store full context
          context: context as any,

          userId: null, // System-generated
        },
      });

      results.sentinel = {
        reportId: savedReport.id,
        summary: report.summary,
        anomalies: context.anomalies,
      };
      console.log("[Cron] Sentinel analysis completed");
    } catch (error) {
      const msg = `Sentinel failed: ${error}`;
      console.error(`[Cron] ${msg}`);
      results.errors.push(msg);
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] Daily analysis completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        results,
      },
      { status: 500 }
    );
  }
}
