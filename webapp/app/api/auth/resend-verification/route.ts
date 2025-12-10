import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getEmailVerificationHTML } from "@/lib/email";
import crypto from "crypto";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
} from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Rate limiting: 1 resend request per minute per email
    const rateLimitResult = checkRateLimit(
      "auth:resend-verification",
      email.toLowerCase(),
      { maxRequests: 1, windowSeconds: 60 }
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[Resend Verification] User not found: ${email}`);
      return NextResponse.json({
        success: true,
        message:
          "If an unverified account exists, a verification email has been sent.",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Token expires in 24 hours
    const expires = new Date(Date.now() + 86400000);

    // Delete any existing verification tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Create new verification token
    await prisma.emailVerificationToken.create({
      data: {
        email: email.toLowerCase(),
        token: hashedToken,
        expires,
      },
    });

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      email
    )}`;

    try {
      await sendEmail({
        to: email,
        subject: "Verify your MarketMinute email",
        html: getEmailVerificationHTML(verifyUrl, email),
      });
      console.log(`[Resend Verification] Email sent to: ${email}`);
    } catch (emailError) {
      console.error("[Resend Verification] Email send failed:", emailError);
      // Don't expose email errors to user
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("[Resend Verification] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
