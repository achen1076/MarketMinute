import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@shared/lib/auth-utils";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user uses Google sign-in
    const hasGoogleAccount = user.accounts.some(
      (account) => account.provider === "google"
    );

    if (hasGoogleAccount && !user.password) {
      return NextResponse.json(
        { error: "Cannot change password for Google accounts" },
        { status: 400 }
      );
    }

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { error: "No password set for this account" },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
