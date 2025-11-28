import { NextResponse } from "next/server";
import { runSentinelAgent } from "@/agents/sentinel/agent/loop";
import { auth } from "@/auth";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rateLimit";

/**
 * Sentinel Preview Endpoint
 *
 * Generates a Sentinel report WITHOUT saving to database.
 * Used for the home page widget to provide quick insights
 * without affecting the main Sentinel dashboard history.
 */
export async function POST() {
  try {
    // Get user session (required for rate limiting)
    const session = await auth();

    // Rate limiting: 3 requests per 5 minutes per user
    // Sentinel is expensive (multiple AI calls), so we limit it heavily
    const identifier = session?.user?.email || "anonymous";
    const rateLimitResult = checkRateLimit(
      "sentinel-preview",
      identifier,
      RateLimitPresets.AI_SENTINEL
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { report } = await runSentinelAgent();

    // Return report WITHOUT saving to database
    return NextResponse.json(
      {
        ok: true,
        report,
        timestamp: new Date().toISOString(),
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (err) {
    console.error("[Sentinel Preview] Error generating report:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate Sentinel preview" },
      { status: 500 }
    );
  }
}
