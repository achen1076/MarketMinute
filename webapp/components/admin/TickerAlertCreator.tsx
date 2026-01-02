"use client";

import { useState } from "react";
import { Bell, CheckCircle, XCircle } from "lucide-react";

export default function TickerAlertCreator() {
  const [symbol, setSymbol] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("custom");
  const [severity, setSeverity] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !title || !message) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/create-ticker-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          title,
          message,
          type,
          severity,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: `Alert created for ${symbol.toUpperCase()}`,
        });
        setSymbol("");
        setTitle("");
        setMessage("");
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to create alert",
        });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Create Ticker Alert
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manually create an alert for a specific ticker symbol
          </p>
        </div>
        <Bell className="h-8 w-8 text-amber-400" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="AAPL"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Alert Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="custom">Custom</option>
              <option value="sentiment_shift">Sentiment Shift</option>
              <option value="price_alert">Price Alert</option>
              <option value="news_alert">News Alert</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Alert title..."
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Alert message..."
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Severity
          </label>
          <div className="flex gap-3">
            {["low", "medium", "high"].map((sev) => (
              <label
                key={sev}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="severity"
                  value={sev}
                  checked={severity === sev}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span
                  className={`text-sm capitalize ${
                    sev === "high"
                      ? "text-rose-400"
                      : sev === "medium"
                      ? "text-amber-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {sev}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !symbol || !title || !message}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Bell className="h-4 w-4" />
          {loading ? "Creating..." : "Create Alert"}
        </button>
      </form>

      {result && (
        <div
          className={`p-4 rounded-md flex items-start gap-3 ${
            result.success
              ? "bg-green-900/20 border border-green-600/50"
              : "bg-red-900/20 border border-red-600/50"
          }`}
        >
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
          )}
          <p className={result.success ? "text-green-100" : "text-red-100"}>
            {result.message}
          </p>
        </div>
      )}
    </div>
  );
}
