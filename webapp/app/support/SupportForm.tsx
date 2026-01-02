"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, MessageSquare } from "lucide-react";

interface SupportFormProps {
  userEmail?: string | null;
}

export default function SupportForm({ userEmail }: SupportFormProps) {
  const [category, setCategory] = useState<"support" | "feedback">("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, email: userEmail, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check for rate limit
        if (res.status === 429) {
          setError(data.error || "Too many requests. Please try again later.");
        } else {
          setError(data.error || "Failed to send message");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Reset form
      setSubject("");
      setMessage("");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Message sent successfully! We'll get back to you soon.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Category selector */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
        <button
          type="button"
          onClick={() => setCategory("support")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            category === "support"
              ? "bg-teal-500 text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Support
        </button>
        <button
          type="button"
          onClick={() => setCategory("feedback")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            category === "feedback"
              ? "bg-teal-500 text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Feedback
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Email
          </label>
          <div className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-muted-foreground">
            {userEmail}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Subject
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                category === "support"
                  ? "How can we help?"
                  : "Share your thoughts"
              }
              className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Message
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              category === "support"
                ? "Describe the issue you're experiencing..."
                : "Share your ideas, suggestions, or feedback..."
            }
            rows={6}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
