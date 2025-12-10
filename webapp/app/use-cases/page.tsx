import { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/colors";
import {
  Briefcase,
  GraduationCap,
  Target,
  TrendingUp,
  Users,
  Laptop,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Use Cases - Perfect for Every Type of Investor",
  description:
    "MarketMinute for busy professionals, active traders, long-term investors, portfolio managers, and learning investors. See how AI-powered insights fit your investing style.",
  keywords: [
    "stock market use cases",
    "investor types",
    "portfolio management",
    "day trading",
    "long-term investing",
    "busy professional investing",
  ],
};

export default function UseCasesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ color: COLORS.text.main }}
        >
          Built for Every Type of{" "}
          <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Investor
          </span>
        </h1>
        <p
          className="text-xl max-w-3xl mx-auto"
          style={{ color: COLORS.text.soft }}
        >
          Whether you're a busy professional, active trader, or long-term
          investor—MarketMinute adapts to your style.
        </p>
      </div>

      {/* Use Cases */}
      <div className="space-y-12">
        <UseCaseCard
          icon={<Briefcase className="w-10 h-10" />}
          title="Busy Professionals"
          subtitle="Stay invested without the full-time commitment"
          challenge="You want to grow your wealth through investing but don't have hours each day to research stocks and follow markets."
          solution="Get your personalized daily brief in under 5 minutes. Know exactly why your portfolio moved, what events are coming up, and when to pay attention—all without opening multiple tabs."
          benefits={[
            "Morning brief covers your entire watchlist in minutes",
            "Smart alerts only for your holdings—no spam",
            "Weekend-safe: catch up on market moves in one view",
            "Mobile-friendly dashboard for quick checks",
          ]}
          testimonial="I used to spend 30+ minutes every morning catching up on my stocks. Now it takes 5 minutes and I understand more."
        />

        <UseCaseCard
          icon={<TrendingUp className="w-10 h-10" />}
          title="Active Traders"
          subtitle="Real-time insights for faster decisions"
          challenge="You trade frequently and need immediate alerts, pattern recognition, and quick access to news that moves prices."
          solution="Real-time price updates every 30 seconds, instant alerts for unusual volume, technical indicators, and breaking news—all in one dashboard with zero lag."
          benefits={[
            "Unusual volume and momentum alerts",
            "Technical indicators and chart patterns",
            "Breaking news notifications (30-second delay)",
            "Quick-glance portfolio performance metrics",
          ]}
          testimonial="The unusual volume alerts caught a 15% move in one of my positions before it hit mainstream news."
        />

        <UseCaseCard
          icon={<Target className="w-10 h-10" />}
          title="Long-Term Investors"
          subtitle="Focus on fundamentals, tune out the noise"
          challenge="You're building wealth for retirement or financial goals. You don't need minute-by-minute updates—just quarterly earnings, major news, and macro trends."
          solution="Track earnings calendars, get summaries of quarterly results, and receive macro event alerts (Fed meetings, CPI, GDP) that affect your holdings—without the daily noise."
          benefits={[
            "Earnings calendar with historical results",
            "Macro economic event tracking (FOMC, CPI, Jobs)",
            "Quarterly performance summaries",
            "Filter alerts to major events only",
          ]}
          testimonial="Perfect for my buy-and-hold strategy. I get earnings alerts and macro updates, but I'm not bombarded with daily noise."
        />

        <UseCaseCard
          icon={<GraduationCap className="w-10 h-10" />}
          title="Learning Investors"
          subtitle="Understand the 'why' behind market moves"
          challenge="You're building your investing knowledge and want to understand market dynamics—not just follow recommendations blindly."
          solution="Our AI explains the reasons behind price movements with news citations, earnings context, and market sentiment. Learn by doing with clear, educational explanations."
          benefits={[
            "Plain-English explanations (no jargon)",
            "News citations for every insight",
            "Sentiment and impact analysis",
            "Historical context for earnings and events",
          ]}
          testimonial="I've learned more about market dynamics in 3 months with MarketMinute than I did in a year reading generic news."
        />

        <UseCaseCard
          icon={<Users className="w-10 h-10" />}
          title="Portfolio Managers & Advisors"
          subtitle="Monitor multiple client portfolios efficiently"
          challenge="You manage multiple portfolios or advise clients. You need a scalable way to track many stocks across different strategies without information overload."
          solution="Create unlimited watchlists for different strategies, clients, or sectors. Get aggregated insights, compare performance, and spot opportunities across all portfolios."
          benefits={[
            "Unlimited watchlists (by strategy, client, sector)",
            "Portfolio-level performance summaries",
            "Bulk alert management",
            "Quick comparison across multiple holdings",
          ]}
          testimonial="I manage 8 different watchlists for clients and my own portfolios. MarketMinute keeps everything organized in one place."
        />

        <UseCaseCard
          icon={<Laptop className="w-10 h-10" />}
          title="Remote & Digital Nomads"
          subtitle="Market insights from anywhere in the world"
          challenge="You're traveling or living abroad. Different time zones, spotty internet, and mobile-first access make it hard to stay connected to markets."
          solution="Cloud-based dashboard accessible from any device. Clean mobile interface, offline-capable summaries, and time-zone-aware alerts keep you informed wherever you are."
          benefits={[
            "Responsive design for all devices",
            "Time-zone-aware event notifications",
            "Low-bandwidth mode for slow connections",
            "Daily email summaries as backup",
          ]}
          testimonial="I'm in Southeast Asia most of the year. MarketMinute's mobile interface and time-zone alerts keep me connected to US markets."
        />
      </div>

      {/* Common Thread */}
      <div
        className="mt-16 rounded-xl p-8 border text-center"
        style={{
          backgroundColor: COLORS.bg.elevated,
          borderColor: COLORS.border.subtle,
        }}
      >
        <h2
          className="text-3xl font-bold mb-4"
          style={{ color: COLORS.text.main }}
        >
          One Platform, Every Investing Style
        </h2>
        <p
          className="text-lg max-w-3xl mx-auto mb-8"
          style={{ color: COLORS.text.soft }}
        >
          No matter how you invest, MarketMinute adapts to your workflow. Create
          custom watchlists, set your alert preferences, and get insights
          tailored to your needs—not generic market news.
        </p>
        <Link
          href="/signin"
          className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-colors hover:opacity-90"
          style={{
            backgroundColor: COLORS.accent.primary,
            color: "#ffffff",
          }}
        >
          Try MarketMinute Free
        </Link>
      </div>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  subtitle,
  challenge,
  solution,
  benefits,
  testimonial,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  challenge: string;
  solution: string;
  benefits: string[];
  testimonial: string;
}) {
  return (
    <div
      className="rounded-xl p-8 border"
      style={{
        backgroundColor: COLORS.bg.elevated,
        borderColor: COLORS.border.subtle,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-6 mb-6">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: "rgba(20, 184, 166, 0.1)" }}
        >
          <div style={{ color: COLORS.accent.primary }}>{icon}</div>
        </div>
        <div>
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: COLORS.text.main }}
          >
            {title}
          </h2>
          <p style={{ color: COLORS.text.soft }}>{subtitle}</p>
        </div>
      </div>

      {/* Challenge & Solution */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3
            className="font-semibold mb-2 text-sm uppercase tracking-wide"
            style={{ color: COLORS.accent.primary }}
          >
            The Challenge
          </h3>
          <p style={{ color: COLORS.text.soft }}>{challenge}</p>
        </div>
        <div>
          <h3
            className="font-semibold mb-2 text-sm uppercase tracking-wide"
            style={{ color: COLORS.accent.primary }}
          >
            How MarketMinute Helps
          </h3>
          <p style={{ color: COLORS.text.soft }}>{solution}</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-6">
        <h3
          className="font-semibold mb-3 text-sm uppercase tracking-wide"
          style={{ color: COLORS.accent.primary }}
        >
          Key Benefits
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full mt-2"
                style={{ backgroundColor: COLORS.accent.primary }}
              />
              <span style={{ color: COLORS.text.soft }}>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div
        className="p-4 rounded-lg border-l-4 italic"
        style={{
          backgroundColor: COLORS.bg.body,
          borderLeftColor: COLORS.accent.primary,
          color: COLORS.text.soft,
        }}
      >
        "{testimonial}"
      </div>
    </div>
  );
}
