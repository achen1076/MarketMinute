"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import PricingCard from "./PricingCard";
import { useTheme } from "@/lib/theme-context";
import { useUserPreferences } from "@/lib/user-preferences-context";

type Tab = "account" | "preferences" | "support";

interface UserData {
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
  user: UserData;
  canChangePassword: boolean;
  emailVerified: boolean;
  userEmail: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("account");
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

  // Use shared preferences context
  const { preferences, setTickerColoring, setAlertPreference } =
    useUserPreferences();
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [tickerColoringMessage, setTickerColoringMessage] = useState("");

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const handleAlertToggle = async () => {
    setAlertLoading(true);
    setAlertMessage("");
    const newValue = !preferences.alertPreference;
    setAlertPreference(newValue);
    setAlertMessage(newValue ? "Alerts enabled" : "Alerts disabled");
    setAlertLoading(false);
  };

  const handleTickerColoringToggle = () => {
    const newValue = !preferences.tickerColoring;
    setTickerColoring(newValue);
    setTickerColoringMessage(
      newValue ? "Ticker coloring enabled" : "Ticker coloring disabled"
    );
    setTimeout(() => setTickerColoringMessage(""), 3000);
  };

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
        window.open(data.url, "_blank", "noopener,noreferrer");
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

  const tabs = [
    { id: "account" as Tab, label: "Account", icon: UserIcon },
    { id: "preferences" as Tab, label: "Preferences", icon: SettingsIcon },
    { id: "support" as Tab, label: "Support", icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-full sm:w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <tab.icon size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
            {/* <span className="xs:hidden">{tab.label.slice(0, 4)}</span> */}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-8">
          {/* Email Verification */}
          {!emailVerified && (
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-amber-500">
                Email Not Verified
              </h2>
              <p className="text-amber-200/80 mb-4">
                Please verify your email address to access all features. Check
                your inbox for the verification link.
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
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Name:</span>{" "}
                {user.name || "Not set"}
              </p>
              <p>
                <span className="font-medium">Verified:</span>{" "}
                <span
                  className={
                    emailVerified ? "text-emerald-400" : "text-amber-400"
                  }
                >
                  {emailVerified ? "✓ Verified" : "✗ Not Verified"}
                </span>
              </p>
            </div>
          </div>

          {/* Subscription Plans */}
          {subscriptionData && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Subscription Plans
              </h2>

              {/* Usage Stats */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    Watchlists
                  </div>
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
                    { text: "20 Watchlist symbols maximum", included: true },
                    { text: "Top Quant Lab signals", included: true },
                    { text: "3 signals from your watchlist", included: true },
                    { text: "Sentinel market reports", included: true },
                    { text: "Price forecasts", included: true },
                    { text: "Unlimited watchlists", included: false },
                    { text: "Unlimited watchlist symbols", included: false },
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
                    { text: "Unlimited Watchlist Symbols", included: true },
                    { text: "Top Quant Lab signals", included: true },
                    {
                      text: "All signals from your watchlists",
                      included: true,
                    },
                    { text: "Sentinel market reports", included: true },
                    { text: "Price forecasts", included: true },
                    { text: "Priority support", included: true },
                  ]}
                />
              </div>

              {/* Manage Subscription */}
              {subscriptionData.subscription.tier !== "free" &&
                subscriptionData.subscription.hasStripeCustomer && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2">
                      Manage Your Subscription
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Update payment method, view invoices, or cancel your
                      subscription
                    </p>
                    <button
                      onClick={handleManageSubscription}
                      disabled={loading}
                      className="bg-secondary hover:bg-secondary/80 text-foreground font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Open Billing Portal
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Change Password */}
          {canChangePassword && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Change Password</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded text-green-500 text-sm">
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
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
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
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
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
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <ThemeAwarePreferences
          alertsEnabled={preferences.alertPreference}
          alertLoading={alertLoading}
          alertMessage={alertMessage}
          handleAlertToggle={handleAlertToggle}
          tickerColoringEnabled={preferences.tickerColoring}
          tickerColoringMessage={tickerColoringMessage}
          handleTickerColoringToggle={handleTickerColoringToggle}
        />
      )}

      {/* Support Tab */}
      {activeTab === "support" && (
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
            <p className="text-muted-foreground mb-4">
              Need help or have feedback? We're here to assist you.
            </p>
            <a
              href="/support"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Contact Support
            </a>
          </div>

          {/* <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Documentation</h2>
            <p className="text-slate-400 mb-4">
              Learn more about MarketMinute features and how to use them.
            </p>
            <a
              href="/about"
              className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              View Documentation
            </a>
          </div> */}

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">App Version</h2>
            <p className="text-muted-foreground">MarketMinute v3.0</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeAwarePreferences({
  alertsEnabled,
  alertLoading,
  alertMessage,
  handleAlertToggle,
  tickerColoringEnabled,
  tickerColoringMessage,
  handleTickerColoringToggle,
}: {
  alertsEnabled: boolean;
  alertLoading: boolean;
  alertMessage: string;
  handleAlertToggle: () => void;
  tickerColoringEnabled: boolean;
  tickerColoringMessage: string;
  handleTickerColoringToggle: () => void;
}) {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    // ThemeProvider's setTheme handles both localStorage and database saves
    setTheme(newTheme);
  };

  return (
    <div className="space-y-8">
      {/* Theme Preference */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
          Appearance
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
          Choose your preferred color theme for the application.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 sm:py-3 rounded-lg border transition-all w-full sm:w-auto ${
                theme === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-muted-foreground text-foreground"
              }`}
            >
              <option.icon size={18} className="shrink-0" />
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alert Preferences */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Alert Preferences</h2>
        <p className="text-muted-foreground mb-4">
          Get notified about significant market movements and events for your
          watchlist. Alerts appear in your inbox.
        </p>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-foreground font-medium">Enable Alerts</span>
            <p className="text-muted-foreground text-sm">
              Receive alerts in your inbox
            </p>
          </div>
          <button
            type="button"
            onClick={handleAlertToggle}
            disabled={alertLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              alertsEnabled ? "bg-primary" : "bg-muted"
            } ${alertLoading ? "opacity-50" : ""}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                alertsEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>

        {alertMessage && (
          <p
            className={`mt-4 text-sm ${
              alertMessage.includes("enabled") ||
              alertMessage.includes("disabled")
                ? "text-emerald-500"
                : "text-destructive"
            }`}
          >
            {alertMessage}
          </p>
        )}
      </div>

      {/* Ticker Coloring Preferences */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Ticker Coloring</h2>
        <p className="text-muted-foreground mb-4">
          Highlight ticker symbols and company names in summaries with colors
          based on stock performance (green for up, red for down).
        </p>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-foreground font-medium">
              Enable Ticker Coloring
            </span>
            <p className="text-muted-foreground text-sm">
              Color-code tickers in market summaries
            </p>
          </div>
          <button
            type="button"
            onClick={handleTickerColoringToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              tickerColoringEnabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                tickerColoringEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>

        {tickerColoringMessage && (
          <p className="mt-4 text-sm text-emerald-500">
            {tickerColoringMessage}
          </p>
        )}
      </div>
    </div>
  );
}
