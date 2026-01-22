import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit, createRateLimitResponse } from "@shared/lib/rateLimit";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);
const LAMBDA_URL = process.env.LAMBDA_FUNCTION_URL;

export async function POST() {
  try {
    // Check admin access
    const session = await auth();
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limit: 10 cron triggers per hour per admin
    const rateLimitResult = checkRateLimit(
      "admin:trigger-cron",
      session.user.email,
      {
        maxRequests: 10,
        windowSeconds: 3600,
      }
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Check if Lambda URL is configured
    if (!LAMBDA_URL) {
      return NextResponse.json(
        {
          ok: false,
          error: "LAMBDA_FUNCTION_URL not configured in environment variables",
        },
        { status: 500 }
      );
    }

    console.log("[Admin] Triggering Lambda cron job manually");

    // Call Lambda function
    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task: "daily_analysis",
      }),
    });

    if (!response.ok) {
      throw new Error(`Lambda returned ${response.status}`);
    }

    const data = await response.json();

    // Lambda returns {statusCode: 200, body: "JSON STRING"}
    // Need to parse the body string
    let result;
    if (data.statusCode && data.body) {
      result =
        typeof data.body === "string" ? JSON.parse(data.body) : data.body;
    } else {
      result = data;
    }

    console.log("[Admin] Parsed result:", {
      tickers_analyzed: result.tickers_analyzed,
      sentinel: result.sentinel,
      timestamp: result.timestamp,
      predictions_count: result.live_predictions?.length,
    });

    return NextResponse.json({
      ok: true,
      message: "Cron job triggered successfully",
      result: {
        predictions_count:
          result.tickers_analyzed || result.live_predictions?.length || 0,
        sentinel_status: result.sentinel?.status || "unknown",
        timestamp: result.timestamp,
      },
    });
  } catch (err: any) {
    console.error("[Admin] Error triggering cron:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to trigger cron job" },
      { status: 500 }
    );
  }
}
