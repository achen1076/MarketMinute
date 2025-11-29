import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getExplanationCacheStats,
  clearExplanationCache,
} from "@/lib/explainCache";
import { getSummaryCacheStats, clearSummaryCache } from "@/lib/summaryCache";
import { getEventsDbStats, clearEventsDb } from "@/lib/eventsDb";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { action } = await req.json();

  if (action === "clear") {
    const explanationCount = await clearExplanationCache();
    const summaryCount = clearSummaryCache();
    const eventsCount = await clearEventsDb();
    const totalCleared = explanationCount + summaryCount + eventsCount;

    return NextResponse.json({
      message: "All caches cleared successfully",
      totalCleared,
      explanationCount,
      summaryCount,
      eventsCount,
      timestamp: new Date().toISOString(),
    });
  }

  return new NextResponse("Invalid action", { status: 400 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const explanationStats = await getExplanationCacheStats();
  const summaryStats = getSummaryCacheStats();
  const eventsStats = await getEventsDbStats();

  const explanationSize =
    explanationStats.redis?.size || explanationStats.memory?.size || 0;
  const summarySize = summaryStats.size || 0;
  const eventsSize = eventsStats.size || 0;

  console.log("[Admin Cache] Stats requested:", {
    explanations: explanationSize,
    summaries: summarySize,
    events: eventsSize,
  });

  return NextResponse.json({
    explanations: {
      size: explanationSize,
      redis: explanationStats.redis,
      memory: explanationStats.memory,
      registered: true,
    },
    summaries: {
      size: summarySize,
      registered: true,
    },
    events: {
      size: eventsSize,
      registered: true,
    },
  });
}
