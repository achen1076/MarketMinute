import { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/colors";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "About - MarketMinute",
  description:
    "Stay informed about your portfolio in minutes, not hours. AI-powered market insights for busy investors.",
  keywords: [
    "about MarketMinute",
    "AI market insights",
    "stock portfolio tracking",
    "market analysis platform",
    "Andrew Chen",
  ],
  alternates: {
    canonical: "https://marketminute.io/about",
  },
};

export default async function AboutPage() {
  const session = await auth();
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-3"
          style={{ color: COLORS.text.main }}
        >
          About MarketMinute
        </h1>
        <p className="text-lg" style={{ color: COLORS.text.soft }}>
          Stay informed about your portfolio in minutes, not hours.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* The Problem */}
        <section
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.bg.elevated,
            borderColor: COLORS.border.subtle,
          }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.text.main }}
          >
            The Problem
          </h2>
          <div className="space-y-3" style={{ color: "#94a3b8" }}>
            <p>
              Staying informed about your portfolio shouldn't feel like a
              full-time job. Yet every day, investors face the same challenges:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Jumping between 5+ websites to track news and prices</li>
              <li>
                Sifting through hundreds of headlines to find what matters
              </li>
              <li>Missing critical events that move your stocks</li>
              <li>
                Spending 30+ minutes just to understand what happened today
              </li>
            </ul>
            <p className="pt-2">
              Professional traders have Bloomberg terminals and research teams.
              Retail investors deserve better too.
            </p>
          </div>
        </section>

        {/* The Solution */}
        <section
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.bg.elevated,
            borderColor: COLORS.border.subtle,
          }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.text.main }}
          >
            The MarketMinute Solution
          </h2>
          <div className="space-y-3" style={{ color: "#94a3b8" }}>
            <p>
              MarketMinute gives you a personalized market brief every
              day—tailored specifically to your watchlist. One dashboard. Few
              minutes. Everything you need to know.
            </p>
            <p>
              Instead of chasing news across the internet, AI reads hundreds of
              articles and distills them into plain-English summaries that
              explain
              <em> why</em> your stocks moved today.
            </p>
            <p>
              You get institutional-grade insights without the institutional
              price tag.
            </p>
          </div>
        </section>

        {/* What You Get */}
        <section
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.bg.elevated,
            borderColor: COLORS.border.subtle,
          }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.text.main }}
          >
            What You Get
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <FeatureCard
              title="📰 Your Daily Brief"
              description="AI-powered summaries that explain why your stocks moved. No jargon, no fluff—just the facts."
            />
            <FeatureCard
              title="🎯 Smart Prioritization"
              description="Star your most important holdings. Get deeper insights on what matters most to you."
            />
            <FeatureCard
              title="🔮 Price Forecasts"
              description="Data-driven predictions for where your stocks might be headed, backed by decades of market history."
            />
            <FeatureCard
              title="🔔 Never Miss a Beat"
              description="Automatic alerts for earnings, unusual volume, and price milestones—so you're always in the loop."
            />
            <FeatureCard
              title="🤖 Sentinel AI"
              description="Your personal market analyst. Spots unusual patterns, tracks volatility shifts, and flags opportunities."
            />
            <FeatureCard
              title="⚡ Real-time Updates"
              description="Live prices and breaking news, refreshed every 30 seconds. Stay current without constantly refreshing."
            />
          </div>
        </section>

        {/* Who It's For */}
        <section
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.bg.elevated,
            borderColor: COLORS.border.subtle,
          }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.text.main }}
          >
            Who Is This For?
          </h2>
          <div className="space-y-4" style={{ color: "#94a3b8" }}>
            <div>
              <h3
                className="font-semibold mb-2"
                style={{ color: COLORS.text.main }}
              >
                💼 Busy Professionals
              </h3>
              <p>
                You want to stay invested but don't have hours to research. Get
                your daily brief in the time it takes to drink your morning
                coffee.
              </p>
            </div>
            <div>
              <h3
                className="font-semibold mb-2"
                style={{ color: COLORS.text.main }}
              >
                📚 Active Learners
              </h3>
              <p>
                You're building your investing knowledge and want to understand
                the
                <em> why</em> behind market moves—not just the numbers.
              </p>
            </div>
            <div>
              <h3
                className="font-semibold mb-2"
                style={{ color: COLORS.text.main }}
              >
                🎯 Focused Investors
              </h3>
              <p>
                You track 10–50 stocks and want a single dashboard that brings
                everything together—no tab-switching required.
              </p>
            </div>
          </div>
        </section>

        {/* Why We Built This */}
        <section
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.bg.elevated,
            borderColor: COLORS.border.subtle,
          }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.text.main }}
          >
            Why We Built This
          </h2>
          <div className="space-y-3" style={{ color: "#94a3b8" }}>
            <p>
              MarketMinute was born from personal frustration. Like many retail
              investors, we were tired of:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Opening 10 browser tabs every morning to catch up</li>
              <li>
                Paying $100/month or more for tools designed for day traders
              </li>
              <li>Getting notifications for stocks we don't even own</li>
              <li>
                Reading AI summaries with no news or facts to back them up
              </li>
            </ul>
            <p className="pt-2">
              We wanted something simple:{" "}
              <strong>
                a personalized morning brief for our actual watchlist.
              </strong>{" "}
              Nothing more, nothing less.
            </p>
            <p>
              So we built it. And now we're sharing it with investors who feel
              the same way.
            </p>
          </div>
        </section>

        {/* About the Founder */}
        <section
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.bg.elevated,
            borderColor: COLORS.border.subtle,
          }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.text.main }}
          >
            About the Founder
          </h2>
          <div className="space-y-4" style={{ color: "#94a3b8" }}>
            <div>
              <h1
                className="text-lg font-semibold mb-2"
                style={{ color: COLORS.text.main }}
              >
                Andrew Chen
              </h1>
              <p style={{ color: COLORS.text.main }}>
                Software Engineer & Investor
              </p>
            </div>

            <p>
              I'm a developer who loves building tools that make complex
              information feel effortless. I've spent years investing, tracking
              markets, and creating systems that help explain why things move,
              not just what happened.
            </p>

            <p>
              MarketMinute started because I was tired of hopping between
              websites every morning, scrolling through endless headlines, and
              still not knowing why my watchlist moved. Most tools were built
              for day traders, overloaded with noise, or too generic to be
              useful for most investors.
            </p>

            <p>
              So I built a dashboard for myself: one place tailored to my own
              watchlist, powered by AI summaries that cut through noise and
              focus on what matters. Now I'm sharing it with anyone who wants
              the same clarity and simplicity.
            </p>

            <p className="font-medium" style={{ color: COLORS.text.main }}>
              I built MarketMinute for people who want to watch the market, but
              dont have enough time.
            </p>
          </div>
        </section>

        {/* Call to Action - Only show if not signed in */}
        {!session?.user && (
          <section
            className="rounded-lg p-6 text-center border"
            style={{
              backgroundColor: COLORS.bg.elevated,
              borderColor: COLORS.border.subtle,
            }}
          >
            <h2
              className="text-2xl font-semibold mb-4"
              style={{ color: COLORS.text.main }}
            >
              Ready to Get Started?
            </h2>
            <p className="mb-6" style={{ color: "#94a3b8" }}>
              Sign in to start building your personalized market dashboard.
            </p>
            <Link
              href="/signin"
              className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors hover:opacity-90"
              style={{
                backgroundColor: COLORS.accent.primary,
                color: "#ffffff",
              }}
            >
              Sign In
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.bg.body }}>
      <h3 className="font-semibold mb-2" style={{ color: COLORS.text.main }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: "#94a3b8" }}>
        {description}
      </p>
    </div>
  );
}
