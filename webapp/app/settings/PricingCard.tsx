"use client";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  tier: "free" | "basic";
  price: number;
  features: PricingFeature[];
  currentTier: string;
  onUpgrade?: () => void;
  loading?: boolean;
}

export default function PricingCard({
  tier,
  price,
  features,
  currentTier,
  onUpgrade,
  loading,
}: PricingCardProps) {
  const isCurrentTier = currentTier === tier;
  const isFree = tier === "free";

  return (
    <div
      className={`relative bg-card border rounded-lg p-6 ${
        isCurrentTier
          ? "border-primary ring-2 ring-primary/20"
          : "border-border"
      } ${!isFree && "hover:border-primary/50 transition-colors"}`}
    >
      {isCurrentTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-medium px-3 py-1 rounded-full">
          Current Plan
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2 capitalize">{tier}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">${price}</span>
          {!isFree && <span className="text-muted-foreground">/month</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            {feature.included ? (
              <svg
                className="w-5 h-5 text-teal-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-slate-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span
              className={
                feature.included ? "text-foreground" : "text-muted-foreground"
              }
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {!isFree && !isCurrentTier && onUpgrade && (
        <button
          onClick={onUpgrade}
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Upgrade Now"}
        </button>
      )}

      {isCurrentTier && !isFree && (
        <div className="text-center text-sm text-muted-foreground">
          You're on this plan
        </div>
      )}
    </div>
  );
}
