import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TrendingUp, BarChart3, LineChart, PieChart } from "lucide-react";

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
                <h3 className="font-semibold text-white text-sm">
                  Quant Labs
                </h3>
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
                <p className="text-xs text-slate-400">Track what matters</p>
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
                <p className="text-xs text-slate-400">Instant insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign in form */}
        <div className="w-full lg:w-auto lg:shrink-0">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 lg:p-10 w-full lg:w-96">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Welcome</h3>
              <p className="text-slate-400">Sign in to access your dashboard</p>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </form>

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
