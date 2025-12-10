import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/organisms/sidebar";
import { MarketTicker } from "@/components/organisms/MarketTicker";
import { auth } from "@/auth";
import { COLORS } from "@/lib/colors";
import { Analytics } from "@vercel/analytics/next";
import EmailVerificationBanner from "@/components/organisms/EmailVerificationBanner";
import { prisma } from "@/lib/prisma";

export const metadata = {
  metadataBase: new URL("https://marketminute.io"),
  title: {
    default: "MarketMinute – AI-Powered Market Insights & Smart Alerts",
    template: "%s | MarketMinute",
  },
  description:
    "MarketMinute delivers AI-powered market explanations, smart alerts, and daily summaries to help you understand every stock move in seconds.",
  keywords: [
    "stock market",
    "AI market insights",
    "stock alerts",
    "market analysis",
    "trading platform",
    "stock watchlist",
    "market summaries",
    "quant analytics",
    "real-time alerts",
    "financial data",
  ],
  authors: [{ name: "MarketMinute" }],
  creator: "MarketMinute",
  publisher: "MarketMinute",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://marketminute.io",
    siteName: "MarketMinute",
    title: "MarketMinute – AI-Powered Market Insights & Smart Alerts",
    description:
      "Get AI-powered market explanations, smart alerts, and daily summaries tailored to your watchlist.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MarketMinute - AI-Powered Market Insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MarketMinute – AI-Powered Market Insights",
    description:
      "Understand every stock move with AI-powered insights and real-time alerts.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/logo.png" }],
    shortcut: ["/logo.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  // Check if user needs email verification
  let needsVerification = false;
  let userEmail = "";

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { emailVerified: true, email: true },
    });

    if (user && !user.emailVerified) {
      needsVerification = true;
      userEmail = user.email!;
    }
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "MarketMinute",
              url: "https://marketminute.io",
              applicationCategory: "FinanceApplication",
              description:
                "AI-powered market insights, stock explanations, smart alerts, and daily summaries.",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "127",
              },
            }),
          }}
        />
      </head>
      <body
        className="min-h-screen"
        style={{ backgroundColor: COLORS.bg.body, color: COLORS.text.main }}
      >
        {/* Sidebar handles its own responsive behavior */}
        <Sidebar user={session?.user} />

        {/* Main content area */}
        <div className="min-h-screen">
          <div className="md:ml-64">
            <MarketTicker />
          </div>
          <main className="mx-auto max-w-[1800px] px-4 py-6 pt-20 md:ml-64 md:pt-8 md:px-8">
            {/* Email Verification Banner */}
            {needsVerification && (
              <div className="mb-6">
                <EmailVerificationBanner userEmail={userEmail} />
              </div>
            )}
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
