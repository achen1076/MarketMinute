import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ResetPasswordForm from "./ResetPasswordForm";
import Link from "next/link";

export const metadata = {
  title: "Reset Password - MarketMinute",
  description: "Create a new password for your account",
};

export default async function ResetPasswordPage() {
  const session = await auth();

  // If already signed in, redirect to dashboard
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Reset Password
            </h1>
            <p className="text-slate-400">Enter your new password</p>
          </div>

          <ResetPasswordForm />

          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
