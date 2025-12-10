import { Metadata } from "next";
import Link from "next/link";
import { COLORS } from "@/lib/colors";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read MarketMinute's Privacy Policy. Learn how we collect, use, and protect your personal information on our AI-powered market insights platform.",
  alternates: {
    canonical: "https://marketminute.io/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1
            className="text-4xl font-bold"
            style={{ color: COLORS.text.main }}
          >
            Privacy Policy
          </h1>
        </div>
        <p style={{ color: COLORS.text.muted }}>
          Effective Date: December 10th, 2025
        </p>
        <p style={{ color: COLORS.text.muted }} className="mb-2">
          Last Updated: December 10th, 2025
        </p>
        <p className="mt-4" style={{ color: COLORS.text.soft }}>
          Welcome to MarketMinute ("Company," "we," "our," or "us"). This
          Privacy Policy explains how we collect, use, disclose, and safeguard
          your information when you use the MarketMinute website, application,
          and services (collectively, the "Service").
        </p>
        <p className="mt-2" style={{ color: COLORS.text.soft }}>
          By accessing or using the Service, you agree to the practices
          described in this Privacy Policy.
        </p>
        <p className="mt-2 font-semibold" style={{ color: COLORS.text.soft }}>
          If you do not agree, please discontinue use of the Service
          immediately.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Section 1 */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: COLORS.text.main }}
          >
            1. Information We Collect
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-4">
            We collect the following categories of personal information:
          </p>

          {/* 1.1 */}
          <div className="mb-4">
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: COLORS.text.main }}
            >
              1.1 Information You Provide
            </h3>
            <ul
              className="list-disc list-inside space-y-2 ml-4"
              style={{ color: COLORS.text.soft }}
            >
              <li>
                <strong>Account Information:</strong> Email address, password
                (hashed), authentication data
              </li>
              <li>
                <strong>Profile Data:</strong> Preferences, watchlist names,
                user settings
              </li>
              <li>
                <strong>Support Communication:</strong> Messages or inquiries
                sent to our support email
              </li>
            </ul>
          </div>

          {/* 1.2 */}
          <div className="mb-4">
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: COLORS.text.main }}
            >
              1.2 Automatically Collected Information
            </h3>
            <ul
              className="list-disc list-inside space-y-2 ml-4 mb-3"
              style={{ color: COLORS.text.soft }}
            >
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Cookies and session identifiers</li>
              <li>Pages visited and interaction data</li>
              <li>Referring URLs</li>
            </ul>
            <p style={{ color: COLORS.text.soft }} className="mb-2">
              Collected via:
            </p>
            <ul
              className="list-disc list-inside space-y-2 ml-4"
              style={{ color: COLORS.text.soft }}
            >
              <li>NextAuth session cookies</li>
              <li>Vercel Analytics</li>
              <li>Server logs</li>
            </ul>
          </div>

          {/* 1.3 */}
          <div className="mb-4">
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: COLORS.text.main }}
            >
              1.3 Financial Information
            </h3>
            <p style={{ color: COLORS.text.soft }} className="mb-2">
              If you subscribe to a paid plan:
            </p>
            <ul
              className="list-disc list-inside space-y-2 ml-4"
              style={{ color: COLORS.text.soft }}
            >
              <li>
                Stripe collects your payment method, billing details, and
                transaction metadata
              </li>
              <li>
                We do not store or have access to your full credit card
                information
              </li>
            </ul>
          </div>

          {/* 1.4 */}
          <div>
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: COLORS.text.main }}
            >
              1.4 AI and Market Data
            </h3>
            <p style={{ color: COLORS.text.soft }} className="mb-2">
              To provide features such as:
            </p>
            <ul
              className="list-disc list-inside space-y-2 ml-4 mb-3"
              style={{ color: COLORS.text.soft }}
            >
              <li>AI explanations</li>
              <li>Smart alerts</li>
              <li>Market summaries</li>
              <li>Watchlist analysis</li>
            </ul>
            <p style={{ color: COLORS.text.soft }} className="mb-2">
              We process:
            </p>
            <ul
              className="list-disc list-inside space-y-2 ml-4 mb-3"
              style={{ color: COLORS.text.soft }}
            >
              <li>Your selected tickers</li>
              <li>Watchlist data</li>
              <li>Relevant market data</li>
            </ul>
            <p style={{ color: COLORS.text.soft }} className="mb-2">
              We may send anonymized or partial content to:
            </p>
            <ul
              className="list-disc list-inside space-y-2 ml-4 mb-3"
              style={{ color: COLORS.text.soft }}
            >
              <li>OpenAI API</li>
              <li>LangChain</li>
              <li>Other AI processing providers</li>
            </ul>
            <p className="font-semibold" style={{ color: COLORS.text.main }}>
              Sensitive personal data is never sent to AI models.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            2. How We Use Your Information
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-3">
            We use your information to:
          </p>
          <ul
            className="list-disc list-inside space-y-2 ml-4"
            style={{ color: COLORS.text.soft }}
          >
            <li>Provide and operate the Service</li>
            <li>Authenticate users via NextAuth</li>
            <li>Personalize dashboards, alerts, and insights</li>
            <li>Improve platform performance and reliability</li>
            <li>Analyze usage patterns</li>
            <li>Process payments (via Stripe)</li>
            <li>Communicate updates and notifications</li>
            <li>Detect, prevent, or investigate fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            3. Cookies and Tracking Technologies
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-3">
            We use cookies for:
          </p>
          <ul
            className="list-disc list-inside space-y-2 ml-4"
            style={{ color: COLORS.text.soft }}
          >
            <li>Authentication</li>
            <li>Session management</li>
            <li>User preferences</li>
            <li>Analytics</li>
            <li>Payment processing</li>
          </ul>
          <p className="mt-3" style={{ color: COLORS.text.soft }}>
            You may disable cookies, but certain features may not function
            correctly.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: COLORS.text.main }}
          >
            4. How We Share Your Information
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-4">
            We may share information with:
          </p>

          {/* 4.1 */}
          <div className="mb-4">
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: COLORS.text.main }}
            >
              4.1 Service Providers
            </h3>
            <ul
              className="list-disc list-inside space-y-2 ml-4 mb-3"
              style={{ color: COLORS.text.soft }}
            >
              <li>Stripe (billing & payments)</li>
              <li>Vercel (hosting & analytics)</li>
              <li>Resend (transactional email)</li>
              <li>OpenAI / AI Providers (processing watchlist insights)</li>
              <li>PostgreSQL / Prisma (data storage)</li>
              <li>Market data APIs (FMP, Schwab, etc.)</li>
            </ul>
            <p style={{ color: COLORS.text.soft }}>
              These providers only access information necessary to perform their
              services.
            </p>
          </div>

          {/* 4.2 */}
          <div>
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: COLORS.text.main }}
            >
              4.2 Legal Requirements
            </h3>
            <p style={{ color: COLORS.text.soft }} className="mb-2">
              We may disclose information if required to:
            </p>
            <ul
              className="list-disc list-inside space-y-2 ml-4 mb-3"
              style={{ color: COLORS.text.soft }}
            >
              <li>Comply with law or legal requests</li>
              <li>Protect rights, property, or safety</li>
              <li>Enforce our Terms of Service</li>
            </ul>
            <p className="font-semibold" style={{ color: COLORS.text.main }}>
              We never sell your personal information.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            5. Data Retention
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-3">
            We retain personal data for as long as:
          </p>
          <ul
            className="list-disc list-inside space-y-2 ml-4"
            style={{ color: COLORS.text.soft }}
          >
            <li>Your account is active</li>
            <li>Necessary to provide the Service</li>
            <li>Required to comply with legal obligations</li>
          </ul>
          <p className="mt-3" style={{ color: COLORS.text.soft }}>
            You may request deletion of your data at any time.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            6. Data Security
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-3">
            We use administrative, technical, and physical safeguards to protect
            your information, including:
          </p>
          <ul
            className="list-disc list-inside space-y-2 ml-4"
            style={{ color: COLORS.text.soft }}
          >
            <li>Encrypted HTTPS connections</li>
            <li>Password hashing</li>
            <li>Access controls</li>
            <li>Database security policies</li>
            <li>Regular monitoring</li>
          </ul>
          <p className="mt-3" style={{ color: COLORS.text.soft }}>
            However, no system is fully secure, and we cannot guarantee absolute
            protection.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            7. Your Privacy Rights
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-3">
            Depending on your location, you may have rights including:
          </p>
          <ul
            className="list-disc list-inside space-y-2 ml-4"
            style={{ color: COLORS.text.soft }}
          >
            <li>Access your personal data</li>
            <li>Update or correct your data</li>
            <li>Delete your data</li>
            <li>Request a copy of your data</li>
            <li>Opt-out of marketing emails</li>
            <li>Limit data processing</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            8. Children's Privacy
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-2">
            MarketMinute is not intended for individuals under 18.
          </p>
          <p style={{ color: COLORS.text.soft }}>
            We do not knowingly collect data from children.
          </p>
        </section>

        {/* Section 9 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            9. Third-Party Links
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-2">
            MarketMinute may contain links to third-party websites.
          </p>
          <p style={{ color: COLORS.text.soft }}>
            We are not responsible for their privacy practices or content.
          </p>
        </section>

        {/* Section 10 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            10. Changes to This Privacy Policy
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-2">
            We may update this policy from time to time.
          </p>
          <p style={{ color: COLORS.text.soft }} className="mb-2">
            Changes will be posted with an updated "Last Updated" date.
          </p>
          <p style={{ color: COLORS.text.soft }}>
            Continued use of the Service indicates acceptance of the updated
            policy.
          </p>
        </section>

        {/* Section 11 */}
        <section>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.text.main }}
          >
            11. Contact Us
          </h2>
          <p style={{ color: COLORS.text.soft }} className="mb-2">
            For questions about this Privacy Policy, contact:
          </p>
          <p style={{ color: COLORS.text.soft }}>
            <strong>MarketMinute Support</strong>
            <br />
            Email:{" "}
            <a
              href="mailto:marketminuteapp@gmail.com"
              className="underline hover:text-teal-400 transition-colors"
            >
              marketminuteapp@gmail.com
            </a>
          </p>
        </section>
      </div>

      {/* Footer */}
      <div
        className="mt-12 pt-8 border-t"
        style={{ borderColor: COLORS.border.subtle }}
      >
        <p style={{ color: COLORS.text.muted }} className="text-sm">
          Last updated: December 10th, 2025
        </p>
        <div className="mt-4 flex gap-4">
          <Link
            href="/terms"
            className="text-sm hover:text-teal-400 transition-colors"
            style={{ color: COLORS.text.soft }}
          >
            Terms of Service
          </Link>
          <Link
            href="/support"
            className="text-sm hover:text-teal-400 transition-colors"
            style={{ color: COLORS.text.soft }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
