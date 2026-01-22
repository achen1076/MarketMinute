import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBillingPortalSession } from "@shared/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
} from "@shared/lib/rateLimit";

/**
 * Create a Stripe billing portal session
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = checkRateLimit(
    "subscription:portal",
    session.user.email,
    RateLimitPresets.SUBSCRIPTION
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    const portalSession = await createBillingPortalSession(
      user.stripeCustomerId,
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/settings`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
