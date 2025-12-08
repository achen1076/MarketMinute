import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Checkout Canceled - MarketMinute",
  description: "Subscription checkout was canceled",
};

export default async function SubscriptionCancelPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Cancel Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        {/* Cancel Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">
            Checkout Canceled
          </h1>
          <p className="text-slate-400 text-lg">
            Your subscription checkout was canceled
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <p className="text-slate-300 text-sm mb-4">
            No charges were made to your account. You can try again anytime or
            continue using the free tier.
          </p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Free tier includes:</strong> 2
              watchlists, top Quant Lab signals, and first 3 watchlist signals
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/settings"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-lg transition-colors text-center border border-slate-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
