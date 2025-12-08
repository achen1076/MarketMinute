/**
 * Subscription Tier Configuration
 *
 * Centralized place to define tier limits and features.
 * Easy to expand for future tiers (pro, enterprise, etc.)
 */

export type SubscriptionTier = "free" | "basic";

export interface TierLimits {
  tier: SubscriptionTier;
  name: string;
  price: number; // Monthly price in dollars
  stripePriceId?: string; // Stripe Price ID
  features: {
    maxWatchlists: number | "unlimited";
    quantLab: {
      enabled: boolean;
      topSignals: boolean;
      watchlistSignals: number | "unlimited";
    };
    sentinelReports: boolean;
    forecasts: boolean;
    emailAlerts: boolean;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierLimits> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    features: {
      maxWatchlists: 2,
      quantLab: {
        enabled: true,
        topSignals: true,
        watchlistSignals: 3, // First 3 from their watchlist
      },
      sentinelReports: true,
      forecasts: true,
      emailAlerts: false,
    },
  },
  basic: {
    tier: "basic",
    name: "Basic",
    price: 9.99,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: {
      maxWatchlists: "unlimited",
      quantLab: {
        enabled: true,
        topSignals: true,
        watchlistSignals: "unlimited",
      },
      sentinelReports: true,
      forecasts: true,
      emailAlerts: false,
    },
  },
};

/**
 * Get tier configuration for a user
 */
export function getTierConfig(tier: string = "free"): TierLimits {
  return (
    SUBSCRIPTION_TIERS[tier as SubscriptionTier] || SUBSCRIPTION_TIERS.free
  );
}

/**
 * Check if user has exceeded a specific limit
 */
export function checkLimit(
  tier: SubscriptionTier,
  limitType: "watchlist" | "quantSignal",
  currentUsage: number
): { allowed: boolean; limit: number | "unlimited"; message?: string } {
  const config = getTierConfig(tier);

  switch (limitType) {
    case "watchlist":
      const watchlistLimit = config.features.maxWatchlists;
      if (watchlistLimit === "unlimited") {
        return { allowed: true, limit: "unlimited" };
      }
      return {
        allowed: currentUsage < watchlistLimit,
        limit: watchlistLimit,
        message:
          currentUsage >= watchlistLimit
            ? `You've reached your limit of ${watchlistLimit} watchlists. Upgrade to get unlimited!`
            : undefined,
      };

    case "quantSignal":
      const signalLimit = config.features.quantLab.watchlistSignals;
      if (signalLimit === "unlimited") {
        return { allowed: true, limit: "unlimited" };
      }
      return {
        allowed: currentUsage < signalLimit,
        limit: signalLimit,
        message:
          currentUsage >= signalLimit
            ? `Free users get access to ${signalLimit} signals from their watchlist. Upgrade for unlimited!`
            : undefined,
      };

    default:
      return { allowed: true, limit: "unlimited" };
  }
}

/**
 * Check if user can access a feature
 */
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits["features"]
): boolean {
  const config = getTierConfig(tier);
  const featureValue = config.features[feature];

  if (typeof featureValue === "boolean") {
    return featureValue;
  }

  if (typeof featureValue === "object" && "enabled" in featureValue) {
    return featureValue.enabled;
  }

  return true;
}
