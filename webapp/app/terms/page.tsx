import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read MarketMinute's Terms of Service. Learn about your rights, responsibilities, and how to use our AI-powered market insights platform.",
  alternates: {
    canonical: "https://marketminute.io/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-4xl font-bold text-foreground">
            Terms of Service
          </h1>
        </div>
        <p className="text-muted-foreground">
          Effective Date: December 10th, 2025
        </p>
        <p className="mt-2 text-foreground/80">
          Welcome to MarketMinute ("Company," "we," "our," or "us"). These Terms
          of Service ("Terms") govern your access to and use of the MarketMinute
          website, platform, and related services (collectively, the "Service").
          By accessing or using the Service, you agree to be bound by these
          Terms.
        </p>
        <p className="mt-2 font-semibold text-foreground/80">
          If you do not agree to these Terms, do not use the Service.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            1. Eligibility
          </h2>
          <p className="text-foreground/80">
            You must be at least 18 years old to use MarketMinute. By using the
            Service, you represent that you have the legal capacity to enter
            into a binding agreement.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            2. Description of Service
          </h2>
          <p className="text-foreground/80 mb-3">MarketMinute provides:</p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>
              AI-powered summaries, explanations, and insights related to
              financial markets
            </li>
            <li>Watchlist management tools</li>
            <li>Smart alerts and notifications</li>
            <li>Market data visualization</li>
            <li>Educational and informational content</li>
          </ul>
          <p className="mt-4 font-semibold text-foreground">
            MarketMinute does not provide financial, legal, or investment
            advice. All information on the platform is for informational
            purposes only.
          </p>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            3. Accounts and Authentication
          </h2>
          <p className="text-foreground/80 mb-3">
            To use certain features, you must create an account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
          <p className="mt-3 text-foreground/80">
            You are responsible for all activities that occur under your
            account.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            4. Subscription and Payments
          </h2>
          <p className="text-foreground/80 mb-3">
            MarketMinute may offer free and paid tiers. By purchasing a
            subscription:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>You authorize us (via Stripe) to charge your payment method</li>
            <li>Subscriptions renew automatically unless canceled</li>
            <li>
              You may cancel at any time, but no refunds will be issued for
              partial billing periods
            </li>
          </ul>
          <p className="mt-3 text-foreground/80">
            We reserve the right to modify pricing with advance notice.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            5. Use of the Service
          </h2>
          <p className="text-foreground/80 mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>Copy, modify, or reverse-engineer any part of the Service</li>
            <li>
              Use the Service for unauthorized financial, trading, or commercial
              purposes
            </li>
            <li>
              Attempt to bypass security features or access data not intended
              for you
            </li>
            <li>Upload harmful content, malware, or abusive material</li>
          </ul>
          <p className="mt-3 text-foreground/80">
            We may suspend or terminate access if you violate these Terms.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            6. Data and Privacy
          </h2>
          <p className="text-foreground/80 mb-3">
            Your use of the Service is also governed by our{" "}
            <Link
              href="/privacy"
              className="underline hover:text-teal-400 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-foreground/80 mb-2">
            We may securely collect and store:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>Account information</li>
            <li>Market preferences</li>
            <li>Watchlist data</li>
            <li>Usage analytics</li>
            <li>Emails used for verification and notifications</li>
          </ul>
          <p className="mt-3 font-semibold text-foreground">
            We do not sell your personal data.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            7. User Content
          </h2>
          <p className="text-foreground/80">
            You retain ownership of any content you submit (e.g., notes,
            watchlist names, preferences). By using the Service, you grant us a
            license to store, process, and display such content solely for
            providing the Service.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            8. Market Data & AI Outputs
          </h2>
          <p className="text-foreground/80 mb-3">
            MarketMinute uses third-party data providers and AI models to
            generate summaries and insights.
          </p>
          <p className="text-foreground/80 mb-2">
            You acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>Data may not be real-time, complete, or accurate</li>
            <li>AI outputs may contain errors</li>
            <li>
              You are solely responsible for decisions made based on the
              information
            </li>
            <li>
              MarketMinute is not liable for financial losses resulting from use
              of the platform
            </li>
          </ul>
          <p className="mt-4 font-semibold text-foreground">
            Again, MarketMinute is not investment advice.
          </p>
        </section>

        {/* Section 9 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            9. Intellectual Property
          </h2>
          <p className="text-foreground/80 mb-3">
            All software, branding, logos, design assets, and content provided
            through the Service are owned by MarketMinute or our licensors.
          </p>
          <p className="text-foreground/80">
            You may not copy, distribute, sell, or recreate any part of the
            Service.
          </p>
        </section>

        {/* Section 10 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            10. Availability & Modifications
          </h2>
          <p className="text-foreground/80 mb-3">
            We may modify, update, or discontinue parts of the Service at any
            time. We are not responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>Downtime</li>
            <li>Data loss</li>
            <li>Service interruptions</li>
            <li>API outages from third-party providers</li>
          </ul>
        </section>

        {/* Section 11 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            11. Termination
          </h2>
          <p className="text-foreground/80 mb-3">
            We may suspend or terminate your account if:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>You violate these Terms</li>
            <li>You misuse the platform</li>
            <li>We suspect fraudulent activity</li>
          </ul>
          <p className="mt-3 text-foreground/80">
            Upon termination, your access to the Service will be revoked.
          </p>
        </section>

        {/* Section 12 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            12. Disclaimer of Warranties
          </h2>
          <p className="text-foreground/80 mb-3">
            The Service is provided "as is" and "as available" without
            warranties of any kind, express or implied.
          </p>
          <p className="text-foreground/80 mb-2">
            We disclaim all warranties related to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>Accuracy</li>
            <li>Reliability</li>
            <li>Availability</li>
            <li>Non-infringement</li>
            <li>Fitness for a particular purpose</li>
          </ul>
        </section>

        {/* Section 13 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            13. Limitation of Liability
          </h2>
          <p className="text-foreground/80 mb-3">
            To the fullest extent permitted by law, MarketMinute is not liable
            for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/80">
            <li>Financial losses</li>
            <li>Trading losses</li>
            <li>Indirect or consequential damages</li>
            <li>Loss of data</li>
            <li>Service outages</li>
            <li>
              Third-party issues (API providers, hosting providers, AI model
              providers, etc.)
            </li>
          </ul>
          <p className="mt-3 text-foreground/80">
            Your sole remedy for dissatisfaction with the Service is
            discontinuing use.
          </p>
        </section>

        {/* Section 14 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            14. Governing Law
          </h2>
          <p className="text-foreground/80">
            These Terms are governed by the laws of the United States and the
            State of California.
          </p>
        </section>

        {/* Section 15 */}
        <section>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            15. Contact
          </h2>
          <p className="text-foreground/80">
            For questions about these Terms, contact:{" "}
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
      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-muted-foreground text-sm">
          Last updated: December 10th, 2025
        </p>
        <div className="mt-4 flex gap-4">
          <Link
            href="/privacy"
            className="text-sm text-foreground/80 hover:text-teal-400 transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
