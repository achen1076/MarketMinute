import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Brain, LineChart, Radio } from "lucide-react";
import SignInForm from "./SignInForm";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MarketMinute | Signin",
  description:
    "Sign in to MarketMinute to access AI-powered market insights, smart alerts, and personalized stock analysis. Get real-time market summaries tailored to your watchlist.",
  keywords: [
    "stock market insights",
    "AI market analysis",
    "smart stock alerts",
    "market summaries",
    "portfolio tracking",
    "stock watchlist",
  ],

  openGraph: {
    title: "MarketMinute – AI-Powered Stock Market Insights",
    description:
      "Get AI-powered market insights, smart alerts, and daily summaries tailored to your watchlist.",
    url: "https://marketminute.io/signin",
    siteName: "MarketMinute",
    type: "website",
  },
};

export default async function SignInPage() {
  const session = await auth();

  // If already signed in, redirect to dashboard
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] relative">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-8">
        {/* Left side - Branding */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-3 text-teal-400 mb-4">
            <h1 className="text-4xl font-bold text-teal-400">MarketMinute</h1>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Your automated <span className="text-teal-400">minute view</span> of
            the markets
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl">
            Get quick insights, real-time alerts, and personalized market
            summaries tailored to your watchlist, all in minutes. Saving you
            priceless time.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-4 pt-6">
            <div className="flex items-start gap-3 text-left">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Custom Watchlists
                </h3>
                <p className="text-xs text-muted-foreground">
                  Track what matters to you
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  AI Summaries and Explainations
                </h3>
                <p className="text-xs text-muted-foreground">
                  News and market based insights
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Signals & Forecasts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Model trained analytics and signaling
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign in form */}
        <div className="w-full lg:w-auto lg:shrink-0">
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8 lg:p-10 w-full lg:w-[480px]">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Welcome
              </h3>
              <p className="text-muted-foreground">
                Sign in to access your dashboard
              </p>
            </div>

            <SignInForm />

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                By signing in, you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline hover:text-teal-400 transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-teal-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
