"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/atoms/Button";
import Link from "next/link";

export default function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [resending, setResending] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (token && email) {
      // Auto-verify if token is in URL
      handleVerify();
    } else if (!email) {
      setMessage({
        type: "error",
        text: "Invalid verification link. Please use the link from your email.",
      });
    }
  }, [token, email]);

  const handleVerify = async () => {
    if (!token || !email) {
      setMessage({
        type: "error",
        text: "Invalid verification link",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Email verified successfully! Redirecting...",
        });
        // Refresh the page to update session
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to verify email",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage({
        type: "error",
        text: "Email address is required",
      });
      return;
    }

    setResending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text:
            data.message || "Verification email sent! Please check your inbox.",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to resend verification email",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          Invalid verification link. Please use the link from your email or
          request a new one.
        </div>
        <Link
          href="/signin"
          className="block text-center text-teal-400 hover:text-teal-300 transition-colors"
        >
          Go to sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : message.type === "error"
              ? "bg-red-500/10 border border-red-500/30 text-red-400"
              : "bg-blue-500/10 border border-blue-500/30 text-blue-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {token ? (
        <div className="text-center">
          {isLoading ? (
            <div className="py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Verifying your email...</p>
            </div>
          ) : (
            message?.type !== "success" && (
              <Button
                onClick={handleVerify}
                variant="primary"
                fullWidth
                disabled={isLoading}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3"
              >
                Verify Email
              </Button>
            )
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm text-center">
            Didn't receive the verification email?
          </p>
          <Button
            onClick={handleResend}
            variant="secondary"
            fullWidth
            disabled={resending}
            className="font-semibold py-3"
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </Button>
        </div>
      )}
    </div>
  );
}
