import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import "./globals.css";
import Sidebar from "@/components/organisms/sidebar";
import MobileBottomNav from "@/components/organisms/MobileBottomNav";
import { MarketTicker } from "@/components/organisms/MarketTicker";
import { ScrollToTop } from "@/components/organisms/ScrollToTop";
import { auth } from "@/auth";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import EmailVerificationBanner from "@/components/organisms/EmailVerificationBanner";
import { prisma } from "@/lib/prisma";
import { ThemeProvider } from "@/lib/theme-context";
import { UserPreferencesProvider } from "@/lib/user-preferences-context";
import { MobileMenuProvider } from "@/lib/mobile-menu-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://marketminute.io"),
  title: {
    default: "MarketMinute – AI-Powered Market Insights",
    template: "%s | MarketMinute",
  },
  description:
    "MarketMinute delivers AI-powered market explanations, quant predictions and forcasts, and daily summaries to help you understand every stock move in seconds.",
  keywords: [
    "stock market",
    "AI market insights",
    "stock alerts",
    "market analysis",
    "stock watchlist",
    "market summaries",
    "quant analytics",
    "real-time alerts",
    "financial data",
    "stock analysis",
    "market updates",
    "marketminute",
    "marketminute.io",
    "marketminute io",
  ],
  authors: [{ name: "MarketMinute" }],
  creator: "MarketMinute",
  publisher: "MarketMinute",
  category: "Finance",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },

      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://marketminute.io/",
    siteName: "MarketMinute",
    title: "MarketMinute – AI-Powered Market Insights",
    description:
      "Get AI-powered market explanations, quant predictions and forecasts, and daily summaries tailored to your watchlist.",
    images: [
      {
        url: "https://marketminute.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "MarketMinute – AI-Powered Market Insights",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MarketMinute – AI-Powered Market Insights",
    description: "Understand every stock move with AI-powered insights",
    images: ["https://marketminute.io/og-image.png"],
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
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

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

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MarketMinute",
    url: "https://marketminute.io",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://marketminute.io/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MarketMinute",
    url: "https://marketminute.io",
    applicationCategory: "FinanceApplication",
    description:
      "AI-powered market insights, stock explanations, smart alerts, and daily summaries.",
    operatingSystem: "Web",
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('marketminute-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else if (theme === 'system') {
                    var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(isDark ? 'dark' : 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Website schema (helps sitelinks and brand understanding) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />

        {/* Application schema (treats MarketMinute as a software product) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <UserPreferencesProvider>
            <MobileMenuProvider>
              <ScrollToTop />
              {/* Sidebar handles its own responsive behavior */}
              <Sidebar user={session?.user} />

              {/* Market ticker - fixed at very top */}
              <MarketTicker />

              {/* Main content area */}
              <div className="min-h-screen md:ml-64">
                <main className="mx-auto max-w-[2400px] px-4 py-6 pt-[105px] md:pt-14 md:px-8 pb-20 md:pb-6">
                  {/* Email Verification Banner */}
                  {needsVerification && (
                    <div className="mb-6">
                      <EmailVerificationBanner userEmail={userEmail} />
                    </div>
                  )}
                  {children}
                </main>
              </div>

              {/* Mobile Bottom Navigation */}
              <MobileBottomNav user={session?.user} />

              <Analytics />
              <SpeedInsights />
            </MobileMenuProvider>
          </UserPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
