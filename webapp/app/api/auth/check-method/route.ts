import { NextRequest, NextResponse } from "next/server";
import { checkUserAuthMethod } from "@/lib/auth-utils";

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
