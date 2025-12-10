import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getPasswordResetEmailHTML } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { accounts: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[Password Reset] User not found: ${email}`);
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    // Check if user has a password (not OAuth-only)
    const hasGoogleAccount = user.accounts.some(
      (account) => account.provider === "google"
    );

    if (hasGoogleAccount && !user.password) {
      console.log(`[Password Reset] OAuth-only account: ${email}`);
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 1 hour
    const expires = new Date(Date.now() + 3600000);

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token: hashedToken,
        expires,
      },
    });

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    try {
      await sendEmail({
        to: email,
        subject: "Reset your MarketMinute password",
        html: getPasswordResetEmailHTML(resetUrl, email),
      });

      console.log(`[Password Reset] Email sent to: ${email}`);
    } catch (emailError) {
      console.error("[Password Reset] Email send failed:", emailError);
      // Don't expose email errors to user
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[Password Reset] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
