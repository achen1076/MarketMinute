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
import { SessionProvider } from "@/components/providers/SessionProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://mintalyze.com"),
  title: {
    default: "Mintalyze – AI-Powered Market Insights",
    template: "Mintalyze | %s",
  },
  description:
    "Mintalyze delivers AI-powered market explanations, quant predictions and forcasts, and daily summaries to help you understand every stock move in seconds.",
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
    "mintalyze",
    "mintalyze.com",
    "mintalyze io",
  ],
  authors: [{ name: "Mintalyze" }],
  creator: "Mintalyze",
  publisher: "Mintalyze",
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
    url: "https://mintalyze.com/",
    siteName: "Mintalyze",
    title: "Mintalyze – AI-Powered Market Insights",
    description:
      "Get AI-powered market explanations, quant predictions and forecasts, and daily summaries tailored to your watchlist.",
    images: [
      {
        url: "https://mintalyze.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mintalyze – AI-Powered Market Insights",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Mintalyze – AI-Powered Market Insights",
    description: "Understand every stock move with AI-powered insights",
    images: ["https://mintalyze.com/og-image.png"],
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
  let showMarketTicker = true;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { emailVerified: true, email: true, showMarketTicker: true },
    });

    if (user && !user.emailVerified) {
      needsVerification = true;
      userEmail = user.email!;
    }

    showMarketTicker = user?.showMarketTicker ?? true;
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
                  (function () {
                    try {
                      var theme = localStorage.getItem('mintalyze-theme');
                      var root = document.documentElement;

                      if (theme === 'light') {
                        root.classList.remove('dark');
                        root.classList.add('light');
                        return;
                      }

                      if (theme === 'dark') {
                        root.classList.remove('light');
                        root.classList.add('dark');
                        return;
                      }

                      // default: system  
                      var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                      root.classList.remove('light', 'dark');
                      root.classList.add(isDark ? 'dark' : 'light');
                    } catch (e) {}
                  })();
                `,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <SessionProvider>
          <ThemeProvider isLoggedIn={!!session}>
            <UserPreferencesProvider isLoggedIn={!!session}>
              <MobileMenuProvider>
                <ScrollToTop />
                {/* Sidebar handles its own responsive behavior */}
                <Sidebar
                  user={session?.user}
                  showMarketTicker={showMarketTicker}
                />

                {/* Market ticker - fixed at very top */}
                {showMarketTicker && <MarketTicker />}

                {/* Main content area */}
                <div className="min-h-screen md:ml-64">
                  <main
                    className={`mx-auto max-w-[2400px] px-4 py-6 md:px-8 pb-20 md:pb-6 ${
                      showMarketTicker ? "pt-[105px] md:pt-14" : ""
                    }`}
                  >
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
        </SessionProvider>
      </body>
    </html>
  );
}
