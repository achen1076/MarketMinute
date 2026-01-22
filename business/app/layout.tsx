import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "@shared/components/providers/SessionProvider";
import { MobileMenuProvider } from "@shared/lib/mobile-menu-context";
import Sidebar from "@shared/components/organisms/Sidebar";
import MobileBottomNav from "@shared/components/organisms/MobileBottomNav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://business.mintalyze.com"),
  title: {
    default: "Mintalyze Business – PDF to Valuation Model in 60 Seconds",
    template: "Mintalyze Business | %s",
  },
  description:
    "Turn 10-Ks, earnings transcripts, and financial PDFs into live, shareable valuation models. Built for analysts, investors, and finance professionals.",
  keywords: [
    "financial modeling",
    "DCF model",
    "valuation",
    "10-K analysis",
    "earnings transcript",
    "investment banking",
    "equity research",
    "financial analysis",
    "PDF to model",
    "live models",
  ],
  authors: [{ name: "Mintalyze" }],
  creator: "Mintalyze",
  publisher: "Mintalyze",
  category: "Finance",
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
    url: "https://business.mintalyze.com/",
    siteName: "Mintalyze Business",
    title: "Mintalyze Business – PDF to Valuation Model in 60 Seconds",
    description:
      "Turn 10-Ks, earnings transcripts, and financial PDFs into live, shareable valuation models.",
    images: [
      {
        url: "https://business.mintalyze.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mintalyze Business – AI-Powered Financial Modeling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mintalyze Business – PDF to Valuation Model in 60 Seconds",
    description:
      "Turn 10-Ks and financial PDFs into live valuation models in seconds",
    images: ["https://business.mintalyze.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
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
                  } else if (theme === 'dark') {
                    root.classList.remove('light');
                    root.classList.add('dark');
                  } else {
                    var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.remove('light', 'dark');
                    root.classList.add(isDark ? 'dark' : 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SessionProvider>
          <MobileMenuProvider>
            <Sidebar user={session?.user} />
            <MobileBottomNav user={session?.user} />
            <main className="md:ml-64 min-h-screen p-6 pb-20 md:pb-6 pt-16 md:pt-6">
              {children}
            </main>
          </MobileMenuProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
