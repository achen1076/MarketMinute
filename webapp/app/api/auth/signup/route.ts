import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, checkUserAuthMethod } from "@shared/lib/auth-utils";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
} from "@shared/lib/rateLimit";
import { sendEmail, getEmailVerificationHTML } from "@shared/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Rate limiting: 5 signups per hour per email
    const rateLimitResult = checkRateLimit(
      "auth:signup",
      email.toLowerCase(),
      RateLimitPresets.AUTH
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const authMethod = await checkUserAuthMethod(email);

    if (authMethod === "google") {
      return NextResponse.json(
        {
          error: "This email is registered with Google Sign-In",
          message: "Please use Google Sign-In to access your account",
          provider: "google",
        },
        { status: 409 }
      );
    }

    if (authMethod === "credentials") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (email not verified yet)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        emailVerified: null, // Will be set after verification
      },
    });

    // Generate verification token
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

    // Create verification token
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
        subject: "Verify your Mintalyze email",
        html: getEmailVerificationHTML(verifyUrl, email),
      });
      console.log(`[Email Verification] Email sent to: ${email}`);
    } catch (emailError) {
      console.error("[Email Verification] Failed to send email:", emailError);
      // Don't fail signup if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created! Please check your email to verify your account.",
        userId: user.id,
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
