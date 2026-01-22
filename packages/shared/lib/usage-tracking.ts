import { prisma } from "@/lib/prisma";
import {
  checkLimit,
  getTierConfig,
  type SubscriptionTier,
} from "@shared/lib/subscription-tiers";

/**
 * Track feature usage for a user
 */
export async function trackUsage(
  userId: string,
  feature: "watchlist" | "quant_signal" | "summary" | "explain",
  metadata?: Record<string, any>
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Upsert usage log (increment if exists, create if not)
    await prisma.usageLog.upsert({
      where: {
        userId_feature_date: {
          userId,
          feature,
          date: today,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        userId,
        feature,
        date: today,
        count: 1,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error("Error tracking usage:", error);
  }
}

/**
 * Get today's usage count for a specific feature
 */
export async function getTodayUsage(
  userId: string,
  feature: "watchlist" | "quant_signal" | "summary" | "explain"
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const log = await prisma.usageLog.findUnique({
      where: {
        userId_feature_date: {
          userId,
          feature,
          date: today,
        },
      },
    });

    return log?.count || 0;
  } catch (error) {
    console.error("Error getting usage:", error);
    return 0;
  }
}

/**
 * Check if user can use a feature (respects tier limits)
 */
export async function canUseFeature(
  userId: string,
  feature: "watchlist" | "quant_signal" | "watchlistItems",
  tier: SubscriptionTier = "free",
  currentCount?: number
): Promise<{
  allowed: boolean;
  limit: number | "unlimited";
  current: number;
  message?: string;
}> {
  let currentUsage = currentCount ?? 0;
  let limitType: "watchlist" | "quantSignal" | "watchlistItems";

  switch (feature) {
    case "watchlist":
      // Count total watchlists
      if (currentCount === undefined) {
        currentUsage = await prisma.watchlist.count({
          where: { userId },
        });
      }
      limitType = "watchlist";
      break;

    case "watchlistItems":
      // Current count should be passed in
      limitType = "watchlistItems";
      break;

    case "quant_signal":
      // This is checked per request, not tracked in usage log
      limitType = "quantSignal";
      currentUsage = 0;
      break;
  }

  const result = checkLimit(tier, limitType, currentUsage);

  return {
    allowed: result.allowed,
    limit: result.limit,
    current: currentUsage,
    message: result.message,
  };
}

/**
 * Get user's subscription tier from database
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    if (!user) {
      return "free";
    }

    // Check if user is an admin (auto-grant basic tier)
    const adminEmails =
      process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    if (user.email && adminEmails.includes(user.email)) {
      return "basic";
    }

    // If subscription is active, return their tier
    if (user.subscriptionStatus === "active" && user.subscriptionTier) {
      return user.subscriptionTier as SubscriptionTier;
    }

    // If subscription is canceled but period hasn't ended yet, keep their access
    if (
      user.subscriptionStatus === "canceled" &&
      user.subscriptionTier &&
      user.subscriptionEndsAt &&
      new Date(user.subscriptionEndsAt) > new Date()
    ) {
      return user.subscriptionTier as SubscriptionTier;
    }

    // Otherwise, they're on free tier
    return "free";
  } catch (error) {
    console.error("Error getting user tier:", error);
    return "free";
  }
}

/**
 * Get comprehensive usage stats for a user
 */
export async function getUserUsageStats(userId: string) {
  const tier = await getUserTier(userId);
  const config = getTierConfig(tier);

  const watchlistCount = await prisma.watchlist.count({ where: { userId } });

  return {
    tier,
    watchlists: {
      used: watchlistCount,
      limit: config.features.maxWatchlists,
      remaining:
        config.features.maxWatchlists === "unlimited"
          ? "unlimited"
          : Math.max(0, config.features.maxWatchlists - watchlistCount),
    },
    quantLab: {
      topSignals: config.features.quantLab.topSignals,
      watchlistSignals: config.features.quantLab.watchlistSignals,
    },
  };
}
