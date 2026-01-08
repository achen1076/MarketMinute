import { redirect } from "next/navigation";
import { auth } from "@/auth";
import VerifyEmailForm from "./VerifyEmailForm";
import Link from "next/link";

export const metadata = {
  title: "Verify Email - MarketMinute",
  description: "Verify your email address",
};

export default async function VerifyEmailPage() {
  const session = await auth();

  // Don't redirect if signed in - allow verification to complete
  // User will be signed out after verification anyway

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground">
              Click the link in your email or enter your code below
            </p>
          </div>

          <VerifyEmailForm />

          <div className="mt-6 text-center space-y-2">
            <Link
              href="/"
              className="block text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Click here if redirect doesnt work
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
