"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PricingCard from "./PricingCard";

interface User {
  id?: string;
  email?: string | null;
  name?: string | null;
}

interface SubscriptionData {
  subscription: {
    tier: string;
    status: string;
    endsAt: string | null;
    hasStripeCustomer: boolean;
  };
  usage: {
    tier: string;
    explains: {
      used: number;
      limit: number | "unlimited";
      remaining: number | "unlimited";
    };
    watchlists: {
      used: number;
      limit: number | "unlimited";
      remaining: number | "unlimited";
    };
  };
}

export default function SettingsContent({
  user,
  canChangePassword,
  emailVerified,
  userEmail,
}: {
  user: User;
  canChangePassword: boolean;
  emailVerified: boolean;
  userEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  useEffect(() => {
    if (verificationCooldown > 0) {
      const timer = setTimeout(
        () => setVerificationCooldown(verificationCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [verificationCooldown]);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Subscription data
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription status");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Failed to change password");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to create checkout session");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred");
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to open billing portal");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationLoading(true);
    setVerificationMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationMessage(
          "Verification email sent! Please check your inbox and click the link."
        );
        setVerificationCooldown(60); // Start 60 second cooldown
      } else {
        // Check if it's a rate limit error
        if (res.status === 429 && data.retryAfter) {
          setVerificationCooldown(data.retryAfter);
          setVerificationMessage(
            `Please wait ${data.retryAfter} seconds before resending.`
          );
        } else {
          setVerificationMessage(
            data.error || "Failed to send verification email"
          );
        }
      }
    } catch (err) {
      setVerificationMessage("An error occurred. Please try again.");
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Email Verification */}
      {!emailVerified && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-amber-500">
            Email Not Verified
          </h2>
          <p className="text-amber-200/80 mb-4">
            Please verify your email address to access all features. Check your
            inbox for the verification link.
          </p>

          {verificationMessage && (
            <p
              className={`text-sm mb-4 ${
                verificationMessage.includes("sent")
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {verificationMessage}
            </p>
          )}

          <button
            onClick={handleResendVerification}
            disabled={verificationLoading || verificationCooldown > 0}
            className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {verificationLoading
              ? "Sending..."
              : verificationCooldown > 0
              ? `Wait ${verificationCooldown}s to resend`
              : "Resend Verification Email"}
          </button>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-2 text-slate-300">
          <p>
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-medium">Name:</span> {user.name || "Not set"}
          </p>
          <p>
            <span className="font-medium">Verified:</span>{" "}
            <span
              className={emailVerified ? "text-emerald-400" : "text-amber-400"}
            >
              {emailVerified ? "✓ Verified" : "✗ Not Verified"}
            </span>
          </p>
        </div>
      </div>

      {/* Subscription Plans */}
      {subscriptionData && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Subscription Plans</h2>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Watchlists</div>
              <div className="text-2xl font-bold">
                {subscriptionData.usage.watchlists.used} /{" "}
                {subscriptionData.usage.watchlists.limit}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {subscriptionData.usage.watchlists.remaining === "unlimited"
                  ? "Unlimited available"
                  : `${subscriptionData.usage.watchlists.remaining} available`}
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <PricingCard
              tier="free"
              price={0}
              currentTier={subscriptionData.subscription.tier}
              features={[
                { text: "2 Watchlists maximum", included: true },
                { text: "Top Quant Lab signals", included: true },
                { text: "3 signals from your watchlist", included: true },
                { text: "Sentinel market reports", included: true },
                { text: "Price forecasts", included: true },
                { text: "Unlimited watchlists", included: false },
                { text: "All quant signals", included: false },
              ]}
            />
            <PricingCard
              tier="basic"
              price={9.99}
              currentTier={subscriptionData.subscription.tier}
              onUpgrade={() => handleUpgrade("basic")}
              loading={loading}
              features={[
                { text: "Unlimited Watchlists", included: true },
                { text: "Top Quant Lab signals", included: true },
                { text: "All signals from your watchlists", included: true },
                { text: "Sentinel market reports", included: true },
                { text: "Price forecasts", included: true },
                { text: "Priority support", included: true },
              ]}
            />
          </div>

          {/* Manage Subscription */}
          {subscriptionData.subscription.tier !== "free" &&
            subscriptionData.subscription.hasStripeCustomer && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">
                  Manage Your Subscription
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Update payment method, view invoices, or cancel your
                  subscription
                </p>
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  Open Billing Portal
                </button>
              </div>
            )}
        </div>
      )}

      {/* Change Password */}
      {canChangePassword && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded text-green-400 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      )}

      {/* Support & Feedback */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Support & Feedback</h2>
        <p className="text-slate-400 mb-4">
          Need help or have feedback? We're here to assist you.
        </p>
        <a
          href="/support"
          className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
