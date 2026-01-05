import {
  Sparkles,
  Clock,
  Target,
  BarChart3,
  LineChart,
  Bell,
  Zap,
  Calendar,
} from "lucide-react";
import { FeatureCard } from "./LandingPageHelpers";

export function CoreFeaturesSection() {
  return (
    <section className="px-4 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for Smart Investors
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to stay informed about your portfolio—in one
            intelligent dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            title="AI-Powered Summaries"
            description="Get personalized daily briefs that explain why your stocks moved. Our AI reads news and distills it into clear, actionable insights, no jargon."
          />
          <FeatureCard
            title="Real-Time Data"
            description="Live prices, volume, and market indicators updated every second. Stay current without constantly refreshing."
          />
          <FeatureCard
            title="Custom Watchlists"
            description="Create custom watchlists and star your most important holdings. Get deeper insights on what matters most to you."
          />
          <FeatureCard
            title="Quant Analytics"
            description="Access model powered analytics: technical indicators, volatility metrics, momentum scores, and pattern recognition, all in one place."
          />
          <FeatureCard
            title="Price Forecasts"
            description="Data-driven price forecasts based on decades of market history. See where your stocks might be headed with quantitative models."
          />
          <FeatureCard
            title="Chat Agent"
            description="Custom chat agent for you and your watchlist. Get recommendations and insights based on your watchlist. Create and modify watchlists."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <FeatureCard
            title="Sentinel AI Intelligence"
            description="Your personal market analyst. Sentinel spots unusual patterns, tracks volatility shifts, flags opportunities, and explains market-wide trends affecting your holdings."
          />
          <FeatureCard
            title="Economic Calendar & Events"
            description="Track upcoming FOMC meetings, CPI reports, earnings dates, and other market-moving events. Never be caught off-guard by scheduled volatility."
          />
        </div>
      </div>
    </section>
  );
}
