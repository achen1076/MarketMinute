"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Mail, X } from "lucide-react";
import Button from "../atoms/Button";

interface EmailVerificationBannerProps {
  userEmail: string;
}

export default function EmailVerificationBanner({
  userEmail,
}: EmailVerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  if (!isVisible) return null;

  const handleResend = async () => {
    setIsResending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Verification email sent! Please check your inbox (and spam folder)."
        );
        setCooldown(60); // Start 60 second cooldown
      } else {
        // Check if it's a rate limit error
        if (response.status === 429 && data.retryAfter) {
          setCooldown(data.retryAfter);
          setMessage(
            `Please wait ${data.retryAfter} seconds before resending.`
          );
        } else {
          setMessage(data.error || "Failed to send email. Please try again.");
        }
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-500 mb-1">
              Email Verification Required
            </h3>
            <p className="text-sm text-amber-200/80 mb-3">
              Please verify your email address <strong>{userEmail}</strong> to
              access all features. Check your inbox for the verification link.
            </p>

            {message && (
              <p
                className={`text-sm mb-3 ${
                  message.includes("sent") ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mail className="w-4 h-4" />
              {isResending
                ? "Sending..."
                : cooldown > 0
                ? `Wait ${cooldown}s to resend`
                : "Resend Verification Email"}
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-500/60 hover:text-amber-500 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
