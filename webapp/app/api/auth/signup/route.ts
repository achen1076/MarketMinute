import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, checkUserAuthMethod } from "@/lib/auth-utils";

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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        emailVerified: new Date(), // Auto-verify for now (you can add email verification later)
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        userId: user.id,
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
