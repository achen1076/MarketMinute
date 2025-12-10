import { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/colors";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Why MarketMinute - Better Than Generic Market Apps",
  description:
    "Compare MarketMinute vs Bloomberg, Yahoo Finance, Seeking Alpha, and other market apps. See why personalized AI insights beat generic news feeds for retail investors.",
  keywords: [
    "MarketMinute vs Bloomberg",
    "MarketMinute vs Yahoo Finance",
    "best stock market app",
    "stock portfolio tracker comparison",
    "AI stock analysis tools",
    "personalized stock insights",
  ],
  alternates: {
    canonical: "https://marketminute.io/why-marketminute",
  },
};

export default function WhyMarketMinutePage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ color: COLORS.text.main }}
        >
          Why Choose{" "}
          <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            MarketMinute
          </span>
          ?
        </h1>
        <p
          className="text-xl max-w-3xl mx-auto"
          style={{ color: COLORS.text.soft }}
        >
          Built for retail investors who want institutional insights without the
          complexity or price tag.
        </p>
      </div>

      {/* Key Differentiators */}
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
          What Makes Us Different
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <DifferenceCard
            title="Personalized for YOUR Watchlist"
            description="Unlike Yahoo Finance or Bloomberg, every insight is tailored to the stocks you actually own—not generic market news you have to filter through."
          />
          <DifferenceCard
            title="AI That Explains 'Why'"
            description="We don't just show price changes. Our AI explains the reasons behind moves with news citations, earnings context, and sentiment analysis."
          />
          <DifferenceCard
            title="No Information Overload"
            description="Most platforms bombard you with notifications for stocks you don't own. We only alert you about your holdings—relevant info only."
          />
          <DifferenceCard
            title="Retail-Friendly Pricing"
            description="Bloomberg Terminal costs $24k+/year. Most pro tools are $100+/month. We bring institutional-quality insights at a fraction of the cost."
          />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mb-16">
        <h2
          className="text-3xl font-bold mb-8 text-center"
          style={{ color: COLORS.text.main }}
        >
          How We Compare
        </h2>

        <div
          className="rounded-xl overflow-hidden border"
          style={{
            backgroundColor: COLORS.bg.elevated,
            borderColor: COLORS.border.subtle,
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: COLORS.bg.body }}>
                <th
                  className="text-left p-4"
                  style={{ color: COLORS.text.main }}
                >
                  Feature
                </th>
                <th
                  className="text-center p-4 font-bold"
                  style={{ color: COLORS.accent.primary }}
                >
                  MarketMinute
                </th>
                <th
                  className="text-center p-4"
                  style={{ color: COLORS.text.soft }}
                >
                  Yahoo Finance
                </th>
                <th
                  className="text-center p-4"
                  style={{ color: COLORS.text.soft }}
                >
                  Bloomberg
                </th>
                <th
                  className="text-center p-4"
                  style={{ color: COLORS.text.soft }}
                >
                  Seeking Alpha
                </th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow
                feature="Personalized Watchlist Insights"
                marketminute={true}
                yahoo={false}
                bloomberg={false}
                seeking={false}
              />
              <ComparisonRow
                feature="AI-Powered Summaries"
                marketminute={true}
                yahoo={false}
                bloomberg={false}
                seeking={true}
              />
              <ComparisonRow
                feature="Smart Alerts (Your Holdings Only)"
                marketminute={true}
                yahoo={false}
                bloomberg={true}
                seeking={false}
              />
              <ComparisonRow
                feature="Price Forecasts"
                marketminute={true}
                yahoo={false}
                bloomberg={true}
                seeking={false}
              />
              <ComparisonRow
                feature="Real-Time Data"
                marketminute={true}
                yahoo={true}
                bloomberg={true}
                seeking={false}
              />
              <ComparisonRow
                feature="Mobile-Friendly"
                marketminute={true}
                yahoo={true}
                bloomberg={false}
                seeking={true}
              />
              <ComparisonRow
                feature="Free Version Available"
                marketminute={true}
                yahoo={true}
                bloomberg={false}
                seeking={false}
              />
              <ComparisonRow
                feature="Typical Monthly Cost"
                marketminute="$0-20"
                yahoo="Free*"
                bloomberg="$2,000+"
                seeking="$30+"
              />
            </tbody>
          </table>
        </div>

        <p
          className="text-sm mt-4 text-center"
          style={{ color: COLORS.text.soft }}
        >
          * Free versions have limited features and extensive ads
        </p>
      </div>

      {/* Who Switched From What */}
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
          What Our Users Say
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <TestimonialCard
            quote="I was using Yahoo Finance and opening 10+ tabs every morning. MarketMinute gives me everything in one place—personalized to my watchlist."
            author="Sarah M."
            previous="Yahoo Finance User"
          />
          <TestimonialCard
            quote="Seeking Alpha had good analysis but it wasn't specific to my holdings. MarketMinute's AI summaries are laser-focused on the stocks I actually own."
            author="James K."
            previous="Seeking Alpha Premium"
          />
          <TestimonialCard
            quote="I couldn't justify $2k/month for Bloomberg as a retail investor. MarketMinute gives me institutional-grade insights at a fraction of the cost."
            author="Michael P."
            previous="Bloomberg Terminal Trial"
          />
          <TestimonialCard
            quote="Robinhood's notifications were overwhelming. I'd get alerts for stocks I didn't even care about. MarketMinute only alerts me about MY watchlist."
            author="Lisa T."
            previous="Robinhood User"
          />
        </div>
      </div>

      {/* Final CTA */}
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
          Ready to Upgrade Your Market Research?
        </h2>
        <p className="text-lg mb-8" style={{ color: COLORS.text.soft }}>
          Join thousands of investors who switched to MarketMinute for
          personalized, AI-powered insights.
        </p>
        <Link
          href="/signin"
          className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-colors hover:opacity-90"
          style={{
            backgroundColor: COLORS.accent.primary,
            color: "#ffffff",
          }}
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}

function DifferenceCard({
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

function ComparisonRow({
  feature,
  marketminute,
  yahoo,
  bloomberg,
  seeking,
}: {
  feature: string;
  marketminute: boolean | string;
  yahoo: boolean | string;
  bloomberg: boolean | string;
  seeking: boolean | string;
}) {
  const renderCell = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 mx-auto" style={{ color: "#10b981" }} />
      ) : (
        <X className="w-5 h-5 mx-auto" style={{ color: "#ef4444" }} />
      );
    }
    return <span style={{ color: COLORS.text.soft }}>{value}</span>;
  };

  return (
    <tr className="border-t" style={{ borderColor: COLORS.border.subtle }}>
      <td className="p-4" style={{ color: COLORS.text.soft }}>
        {feature}
      </td>
      <td className="p-4 text-center">{renderCell(marketminute)}</td>
      <td className="p-4 text-center">{renderCell(yahoo)}</td>
      <td className="p-4 text-center">{renderCell(bloomberg)}</td>
      <td className="p-4 text-center">{renderCell(seeking)}</td>
    </tr>
  );
}

function TestimonialCard({
  quote,
  author,
  previous,
}: {
  quote: string;
  author: string;
  previous: string;
}) {
  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: COLORS.bg.body,
        borderColor: COLORS.border.subtle,
      }}
    >
      <p className="italic mb-4" style={{ color: COLORS.text.soft }}>
        "{quote}"
      </p>
      <div>
        <p className="font-semibold" style={{ color: COLORS.text.main }}>
          {author}
        </p>
        <p className="text-sm" style={{ color: COLORS.text.soft }}>
          Previously: {previous}
        </p>
      </div>
    </div>
  );
}
