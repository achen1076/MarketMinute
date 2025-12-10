import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid verification token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        email: email.toLowerCase(),
        token: hashedToken,
        expires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user emailVerified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete used token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Delete all other verification tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Verify the update was successful
    const verifiedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });

    if (!verifiedUser?.emailVerified) {
      console.error(
        `[Email Verification] Failed to verify - DB update didn't persist for: ${email}`
      );
      return NextResponse.json(
        { error: "Verification update failed. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[Email Verification] Email verified for: ${email}`);

    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });

    // Prevent any caching of this response
    response.headers.set("Cache-Control", "no-store, max-age=0");

    return response;
  } catch (error) {
    console.error("[Email Verification] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
