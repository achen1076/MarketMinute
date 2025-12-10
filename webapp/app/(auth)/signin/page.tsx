import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TrendingUp, BarChart3, LineChart, PieChart } from "lucide-react";
import SignInForm from "./SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to MarketMinute to access AI-powered market insights, smart alerts, and personalized stock analysis.",
  alternates: {
    canonical: "https://marketminute.io/signin",
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
            <TrendingUp className="w-10 h-10" />
            <h1 className="text-4xl font-bold bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              MarketMinute
            </h1>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            Your automated{" "}
            <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              minute view
            </span>{" "}
            of the markets
          </h2>

          <p className="text-lg text-slate-400 max-w-xl">
            Get quick insights, real-time alerts, and personalized market
            summaries tailored to your watchlist—all in minutes.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="flex items-start gap-3 text-left">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Quant Labs</h3>
                <p className="text-xs text-slate-400">
                  Model trained analytics
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Custom Watchlists
                </h3>
                <p className="text-xs text-slate-400">
                  Track what matters to you
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  AI Summaries
                </h3>
                <p className="text-xs text-slate-400">News based insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign in form */}
        <div className="w-full lg:w-auto lg:shrink-0">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 lg:p-10 w-full lg:w-[480px]">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Welcome</h3>
              <p className="text-slate-400">Sign in to access your dashboard</p>
            </div>

            <SignInForm />

            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs text-center text-slate-500">
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
