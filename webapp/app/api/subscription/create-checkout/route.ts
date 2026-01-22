import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCheckoutSession } from "@shared/lib/stripe";
import { SUBSCRIPTION_TIERS } from "@shared/lib/subscription-tiers";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
} from "@shared/lib/rateLimit";

/**
 * Create a Stripe checkout session for subscription
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting: 5 checkout sessions per hour per user
  const rateLimitResult = checkRateLimit(
    "subscription:checkout",
    session.user.email,
    RateLimitPresets.SUBSCRIPTION
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { tier } = await req.json();

    // Validate tier
    const tierConfig =
      SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    if (!tierConfig || !tierConfig.stripePriceId) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      );
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      session.user.id,
      session.user.email,
      tierConfig.stripePriceId,
      `${
        process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
      }/subscription/success`,
      `${
        process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
      }/subscription/cancel`
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
