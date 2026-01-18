import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://business.marketminute.io"),
  title: {
    default: "MarketMinute Business – PDF to Valuation Model in 60 Seconds",
    template: "MarketMinute Business | %s",
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
  authors: [{ name: "MarketMinute" }],
  creator: "MarketMinute",
  publisher: "MarketMinute",
  category: "Finance",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://business.marketminute.io/",
    siteName: "MarketMinute Business",
    title: "MarketMinute Business – PDF to Valuation Model in 60 Seconds",
    description:
      "Turn 10-Ks, earnings transcripts, and financial PDFs into live, shareable valuation models.",
    images: [
      {
        url: "https://business.marketminute.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "MarketMinute Business – AI-Powered Financial Modeling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MarketMinute Business – PDF to Valuation Model in 60 Seconds",
    description:
      "Turn 10-Ks and financial PDFs into live valuation models in seconds",
    images: ["https://business.marketminute.io/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('marketminute-theme');
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
        {children}
      </body>
    </html>
  );
}
