import { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/colors";
import {
  TrendingUp,
  Bell,
  LineChart,
  Target,
  Sparkles,
  Clock,
  BarChart3,
  Zap,
  Shield,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features - AI-Powered Stock Market Insights",
  description:
    "Discover MarketMinute's features: AI summaries, smart alerts, price forecasts, quant analytics, real-time tracking, and custom watchlists for smarter investing.",
  keywords: [
    "stock market features",
    "AI stock analysis",
    "stock alerts",
    "price forecasts",
    "market analytics",
    "watchlist tracker",
  ],
};

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ color: COLORS.text.main }}
        >
          Powerful Features for{" "}
          <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Smart Investors
          </span>
        </h1>
        <p
          className="text-xl max-w-3xl mx-auto"
          style={{ color: COLORS.text.soft }}
        >
          Everything you need to stay informed about your portfolio—in one
          intelligent dashboard.
        </p>
      </div>

      {/* Main Features Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <FeatureCard
          icon={<Sparkles className="w-8 h-8" />}
          title="AI-Powered Market Summaries"
          description="Get personalized daily briefs that explain why your stocks moved. Our AI reads hundreds of news articles and distills them into clear, actionable insights—no jargon, just the facts you need."
          keywords={["AI summaries", "market analysis", "stock news"]}
        />

        <FeatureCard
          icon={<Bell className="w-8 h-8" />}
          title="Smart Alerts & Notifications"
          description="Never miss important events. Get instant alerts for earnings reports, unusual volume, price milestones, and breaking news—all tailored to your watchlist."
          keywords={["stock alerts", "notifications", "earnings alerts"]}
        />

        <FeatureCard
          icon={<LineChart className="w-8 h-8" />}
          title="Price Forecasts & Predictions"
          description="Data-driven price forecasts based on decades of market history. See where your stocks might be headed with quantitative models trained on historical patterns."
          keywords={["price forecasts", "stock predictions", "market trends"]}
        />

        <FeatureCard
          icon={<BarChart3 className="w-8 h-8" />}
          title="Quant Labs Analytics"
          description="Access institutional-grade analytics without the institutional price. Technical indicators, volatility metrics, momentum scores, and pattern recognition—all in one place."
          keywords={["quant analytics", "technical analysis", "market data"]}
        />

        <FeatureCard
          icon={<Target className="w-8 h-8" />}
          title="Custom Watchlists"
          description="Create unlimited watchlists and star your most important holdings. Get deeper insights on what matters most to you with prioritized coverage and alerts."
          keywords={["watchlist", "portfolio tracking", "stock tracker"]}
        />

        <FeatureCard
          icon={<Clock className="w-8 h-8" />}
          title="Real-Time Market Data"
          description="Live prices, volume, and market indicators updated every 30 seconds. Stay current without constantly refreshing—we handle the updates for you."
          keywords={["real-time data", "live prices", "market updates"]}
        />

        <FeatureCard
          icon={<Zap className="w-8 h-8" />}
          title="Sentinel AI Intelligence"
          description="Your personal market analyst. Sentinel spots unusual patterns, tracks volatility shifts, flags opportunities, and explains market-wide trends that affect your holdings."
          keywords={["AI analyst", "market intelligence", "pattern detection"]}
        />

        <FeatureCard
          icon={<TrendingUp className="w-8 h-8" />}
          title="Economic Calendar & Events"
          description="Track upcoming FOMC meetings, CPI reports, earnings dates, and other market-moving events. Never be caught off-guard by scheduled volatility."
          keywords={["economic calendar", "earnings calendar", "market events"]}
        />
      </div>

      {/* Additional Benefits */}
      <div
        className="rounded-xl p-8 mb-16 border"
        style={{
          backgroundColor: COLORS.bg.elevated,
          borderColor: COLORS.border.subtle,
        }}
      >
        <h2
          className="text-3xl font-bold mb-8 text-center"
          style={{ color: COLORS.text.main }}
        >
          Why Choose MarketMinute?
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <BenefitItem
            icon={<Shield className="w-6 h-6" />}
            title="No Credit Card Required"
            description="Start tracking your portfolio immediately. No payment info needed to get started."
          />
          <BenefitItem
            icon={<Clock className="w-6 h-6" />}
            title="Save Hours Every Week"
            description="Get your daily market brief in minutes instead of hours of research across multiple sites."
          />
          <BenefitItem
            icon={<Users className="w-6 h-6" />}
            title="Built for Retail Investors"
            description="Institutional-quality insights without the complexity or $100+/month price tags."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div
        className="text-center rounded-xl p-12 border"
        style={{
          backgroundColor: COLORS.bg.elevated,
          borderColor: COLORS.border.subtle,
        }}
      >
        <h2
          className="text-3xl font-bold mb-4"
          style={{ color: COLORS.text.main }}
        >
          Ready to Get Started?
        </h2>
        <p className="text-lg mb-8" style={{ color: COLORS.text.soft }}>
          Join thousands of investors who save time with MarketMinute.
        </p>
        <Link
          href="/signin"
          className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-colors hover:opacity-90"
          style={{
            backgroundColor: COLORS.accent.primary,
            color: "#ffffff",
          }}
        >
          Start Tracking Your Portfolio
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  keywords,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  keywords: string[];
}) {
  return (
    <div
      className="rounded-xl p-6 border hover:border-teal-500/50 transition-colors"
      style={{
        backgroundColor: COLORS.bg.elevated,
        borderColor: COLORS.border.subtle,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: "rgba(20, 184, 166, 0.1)" }}
        >
          <div style={{ color: COLORS.accent.primary }}>{icon}</div>
        </div>
        <div className="flex-1">
          <h3
            className="text-xl font-semibold mb-3"
            style={{ color: COLORS.text.main }}
          >
            {title}
          </h3>
          <p className="mb-4" style={{ color: COLORS.text.soft }}>
            {description}
          </p>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(20, 184, 166, 0.1)",
                  color: COLORS.accent.primary,
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div
        className="inline-flex p-3 rounded-lg mb-4"
        style={{ backgroundColor: "rgba(20, 184, 166, 0.1)" }}
      >
        <div style={{ color: COLORS.accent.primary }}>{icon}</div>
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: COLORS.text.main }}
      >
        {title}
      </h3>
      <p style={{ color: COLORS.text.soft }}>{description}</p>
    </div>
  );
}
