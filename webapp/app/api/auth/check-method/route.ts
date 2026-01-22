import { NextRequest, NextResponse } from "next/server";
import { checkUserAuthMethod } from "@shared/lib/auth-utils";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
} from "@shared/lib/rateLimit";

/**
 * Check which auth method a user has (google, credentials, or none)
 * This is called BEFORE attempting login to show appropriate error messages
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Rate limiting: 10 checks per minute per email (prevent email enumeration)
    const rateLimitResult = checkRateLimit(
      "auth:check-method",
      email.toLowerCase(),
      { maxRequests: 10, windowSeconds: 60 }
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    const authMethod = await checkUserAuthMethod(email);

    return NextResponse.json({
      authMethod,
      exists: authMethod !== "none",
    });
  } catch (error) {
    console.error("Check auth method error:", error);
    return NextResponse.json(
      { error: "Failed to check auth method" },
      { status: 500 }
    );
  }
}
