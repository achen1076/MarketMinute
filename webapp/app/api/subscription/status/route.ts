import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserUsageStats } from "@/lib/usage-tracking";
import { prisma } from "@/lib/prisma";

/**
 * Get user's subscription status and usage stats
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const usageStats = await getUserUsageStats(user.id);

    return NextResponse.json({
      subscription: {
        tier: user.subscriptionTier || "free",
        status: user.subscriptionStatus || "inactive",
        endsAt: user.subscriptionEndsAt,
        hasStripeCustomer: !!user.stripeCustomerId,
      },
      usage: usageStats,
    });
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
