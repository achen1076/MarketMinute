import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getExplanationCacheStats,
  clearExplanationCache,
} from "@/lib/explainCache";
import {
  getSummaryCacheStats,
  clearSummaryCache,
} from "@/lib/summaryCache";
import {
  getEventsCacheStats,
  clearEventsCache,
} from "@/lib/eventsCache";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { action } = await req.json();

  if (action === "clear") {
    const explanationCount = clearExplanationCache();
    const summaryCount = clearSummaryCache();
    const eventsCount = clearEventsCache();
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

  const explanationStats = getExplanationCacheStats();
  const summaryStats = getSummaryCacheStats();
  const eventsStats = getEventsCacheStats();

  console.log("[Admin Cache] Stats requested:", {
    explanations: explanationStats.size,
    summaries: summaryStats.size,
    events: eventsStats.size,
  });

  return NextResponse.json({
    explanations: {
      size: explanationStats.size,
      registered: true,
    },
    summaries: {
      size: summaryStats.size,
      registered: true,
    },
    events: {
      size: eventsStats.size,
      registered: true,
    },
  });
}
