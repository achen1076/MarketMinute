import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Subscription Successful - MarketMinute",
  description: "Your subscription has been activated",
};

export default async function SubscriptionSuccessPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">
            Subscription Activated! 🎉
          </h1>
          <p className="text-slate-400 text-lg">
            Welcome to the{" "}
            <span className="text-emerald-400 font-semibold">Basic</span> tier
          </p>
        </div>

        {/* Benefits Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            You now have access to:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span className="text-slate-300 text-sm">
                <strong>Unlimited watchlists</strong> - Create as many as you
                need
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span className="text-slate-300 text-sm">
                <strong>All Quant Lab signals</strong> - Full access to
                predictions for your entire watchlist
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span className="text-slate-300 text-sm">
                <strong>Priority support</strong> - Get help when you need it
              </span>
            </li>
          </ul>
        </div>

        {/* Receipt Info */}
        {/* <div className="bg-blue-500/5 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-300">
            <span className="text-blue-400 font-semibold">Receipt sent</span> -
            Check your email ({session.user.email}) for your receipt and
            subscription details.
          </p>
        </div> */}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
          >
            Start Exploring
          </Link>
          <Link
            href="/settings"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-lg transition-colors text-center border border-slate-700"
          >
            View Subscription Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
