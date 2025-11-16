import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  clearExplanationCache,
  getExplanationCacheStats,
} from "@/lib/explainCache";
import {
  clearSummaryCache,
  getSummaryCacheStats,
} from "@/lib/summaryCache";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { action } = await req.json();

  if (action === "clear") {
    const explanationCount = clearExplanationCache();
    const summaryCount = clearSummaryCache();
    const totalCleared = explanationCount + summaryCount;

    return NextResponse.json({
      message: "All caches cleared successfully",
      totalCleared,
      explanationCount,
      summaryCount,
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

  console.log("[Admin Cache] Stats requested:", {
    explanations: explanationStats.size,
    summaries: summaryStats.size,
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
  });
}
