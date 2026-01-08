"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useUserPreferences } from "@/lib/user-preferences-context";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshTheme } = useTheme();
  const { refreshPreferences } = useUserPreferences();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Check for verification success
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMessage("Email verified! Please sign in to continue.");
      // Clear the query param after showing message
      router.replace("/signin", { scroll: false });
    }
  }, [searchParams, router]);

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        // Signup
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.provider === "google") {
            setError(
              "This email is registered with Google. Please use Google Sign-In."
            );
          } else {
            setError(data.error || "Failed to create account");
          }
          setLoading(false);
          return;
        }

        // Auto sign in after signup
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError(
            "Account created, but sign in failed. Please try signing in."
          );
        } else {
          await Promise.all([refreshTheme(), refreshPreferences()]);
          router.push("/");
          router.refresh();
        }
      } else {
        // Sign in - first check auth method
        const checkRes = await fetch("/api/auth/check-method", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const checkData = await checkRes.json();

        // If user has Google account, block password login
        if (checkData.authMethod === "google") {
          setError(
            "This email is registered with Google. Please use 'Sign in with Google' below."
          );
          setLoading(false);
          return;
        }

        // If no account exists
        if (!checkData.exists) {
          setError("No account found with this email. Try signing up first.");
          setLoading(false);
          return;
        }

        // Proceed with credentials sign in
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          // At this point, it's likely a password error
          setError("Incorrect password. Please try again.");
        } else {
          await Promise.all([refreshTheme(), refreshPreferences()]);
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { redirectTo: "/" });
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab selector */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError("");
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
            mode === "signin"
              ? "bg-teal-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
            mode === "signup"
              ? "bg-teal-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Sign Up
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-muted-foreground">
              Password
            </label>
            {mode === "signin" && (
              <a
                href="/forgot-password"
                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            />
          </div>
          {mode === "signup" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-muted disabled:text-muted-foreground text-white font-semibold py-3.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          {loading
            ? "Loading..."
            : mode === "signup"
            ? "Create Account"
            : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-card text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-muted/90 disabled:bg-muted disabled:text-muted-foreground text-slate-900 font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
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
        {loading ? "Loading..." : "Sign in with Google"}
      </button>
    </div>
  );
}
