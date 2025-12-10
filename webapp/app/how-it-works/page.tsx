import { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/colors";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works - Stock Market Insights Made Simple",
  description:
    "Learn how MarketMinute delivers AI-powered stock insights. Create watchlists, get personalized summaries, receive smart alerts, and track market events—all in minutes.",
  keywords: [
    "how it works",
    "stock market platform",
    "AI stock insights",
    "market analysis guide",
    "portfolio tracking",
  ],
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ color: COLORS.text.main }}
        >
          How MarketMinute Works
        </h1>
        <p
          className="text-xl max-w-3xl mx-auto"
          style={{ color: COLORS.text.soft }}
        >
          Get personalized market insights in 3 simple steps. No complexity, no
          information overload—just the data you need.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-12 mb-16">
        <StepCard
          number="1"
          title="Create Your Watchlist"
          description="Add the stocks you care about—whether it's 5 or 50 tickers. You can create multiple watchlists for different strategies, portfolios, or sectors."
          features={[
            "Unlimited watchlists",
            "Star your most important holdings",
            "Quick search and add interface",
            "Organize by strategy or portfolio",
          ]}
        />

        <StepCard
          number="2"
          title="Get AI-Powered Insights"
          description="Every day, our AI reads hundreds of news articles and market data points to explain why your stocks moved. You get a personalized brief tailored to your watchlist—not generic market news."
          features={[
            "Daily market summaries for your holdings",
            "Plain-English explanations (no jargon)",
            "Key price drivers and catalysts",
            "Sentiment analysis and impact ratings",
          ]}
        />

        <StepCard
          number="3"
          title="Stay Ahead with Smart Alerts"
          description="Receive instant notifications for earnings, unusual volume, price milestones, and breaking news. Only get alerts for stocks you actually own—no spam."
          features={[
            "Earnings and event reminders",
            "Price movement alerts",
            "Unusual volume detection",
            "Breaking news notifications",
          ]}
        />
      </div>

      {/* What Makes Us Different */}
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
          What Makes MarketMinute Different?
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <DifferentiatorCard
            title="Personalized for Your Watchlist"
            description="Unlike generic market apps, every insight is tailored to the stocks you actually own. No clutter, no noise—just relevant information."
          />
          <DifferentiatorCard
            title="AI That Explains 'Why'"
            description="We don't just show you what happened. Our AI explains the reasons behind price movements with news citations and context."
          />
          <DifferentiatorCard
            title="Built for Busy Investors"
            description="Get your daily market brief in under 5 minutes. No need to open 10 tabs or scroll through endless headlines."
          />
          <DifferentiatorCard
            title="Institutional Tools, Retail Price"
            description="Access quant analytics, price forecasts, and real-time data that used to require expensive professional tools."
          />
        </div>
      </div>

      {/* Real-World Example */}
      <div
        className="rounded-xl p-8 mb-16 border"
        style={{
          backgroundColor: COLORS.bg.elevated,
          borderColor: COLORS.border.subtle,
        }}
      >
        <h2
          className="text-2xl font-bold mb-6"
          style={{ color: COLORS.text.main }}
        >
          Real-World Example
        </h2>

        <div
          className="space-y-4 p-6 rounded-lg mb-6"
          style={{ backgroundColor: COLORS.bg.body }}
        >
          <p style={{ color: COLORS.text.soft }}>
            <strong style={{ color: COLORS.text.main }}>Scenario:</strong>{" "}
            You're tracking AAPL, MSFT, and NVDA in your tech watchlist.
          </p>

          <div className="space-y-3">
            <ExampleStep
              time="9:00 AM"
              action="Market opens, you check your dashboard"
              result="See NVDA is up 3.2% on earnings beat, MSFT flat, AAPL down 1.1% on analyst downgrade"
            />
            <ExampleStep
              time="9:05 AM"
              action="Click on NVDA for details"
              result="AI summary: 'NVDA reported Q4 EPS of $5.16 vs $4.64 expected, beating estimates by 11%. Data center revenue grew 217% YoY...'"
            />
            <ExampleStep
              time="11:30 AM"
              action="Receive smart alert"
              result="'AAPL experiencing unusual volume spike. News: Apple announces new AI partnership with OpenAI...'"
            />
            <ExampleStep
              time="5:00 PM"
              action="Check end-of-day summary"
              result="Your watchlist performance: +1.8%. Top mover: NVDA (+5.4%). Key takeaway: Semiconductor sector strong on AI demand."
            />
          </div>
        </div>

        <p style={{ color: COLORS.text.soft }}>
          <strong style={{ color: COLORS.text.main }}>Result:</strong> You
          stayed informed all day without constant tab-switching or stress. You
          understood why your portfolio moved and received timely alerts for
          actionable events.
        </p>
      </div>

      {/* CTA */}
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
          Ready to Simplify Your Market Research?
        </h2>
        <p className="text-lg mb-8" style={{ color: COLORS.text.soft }}>
          Join thousands of investors who save time with MarketMinute.
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition-colors hover:opacity-90"
          style={{
            backgroundColor: COLORS.accent.primary,
            color: "#ffffff",
          }}
        >
          Get Started Free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  features,
}: {
  number: string;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div
      className="rounded-xl p-8 border"
      style={{
        backgroundColor: COLORS.bg.elevated,
        borderColor: COLORS.border.subtle,
      }}
    >
      <div className="flex items-start gap-6">
        <div
          className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            backgroundColor: "rgba(20, 184, 166, 0.1)",
            color: COLORS.accent.primary,
          }}
        >
          {number}
        </div>
        <div className="flex-1">
          <h3
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            {title}
          </h3>
          <p className="mb-6" style={{ color: COLORS.text.soft }}>
            {description}
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <CheckCircle2
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: COLORS.accent.primary }}
                />
                <span style={{ color: COLORS.text.soft }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DifferentiatorCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: COLORS.bg.body,
        borderColor: COLORS.border.subtle,
      }}
    >
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

function ExampleStep({
  time,
  action,
  result,
}: {
  time: string;
  action: string;
  result: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="flex-shrink-0 px-3 py-1 rounded text-sm font-semibold"
        style={{
          backgroundColor: "rgba(20, 184, 166, 0.1)",
          color: COLORS.accent.primary,
        }}
      >
        {time}
      </div>
      <div className="flex-1">
        <p className="font-medium mb-1" style={{ color: COLORS.text.main }}>
          {action}
        </p>
        <p className="text-sm" style={{ color: COLORS.text.soft }}>
          {result}
        </p>
      </div>
    </div>
  );
}
