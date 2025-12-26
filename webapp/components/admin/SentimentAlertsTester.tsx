"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";

interface SentimentAlertsTesterProps {
  watchlistId?: string;
}

export default function SentimentAlertsTester({
  watchlistId,
}: SentimentAlertsTesterProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!watchlistId) {
      setError("Please select a watchlist first");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/test-sentiment-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchlistId }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to process sentiment alerts");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-2">
        Sentiment Alerts
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Test sentiment shift detection for all watchlist symbols. Creates alerts
        when significant sentiment changes are detected.
      </p>

      <Button variant="secondary" onClick={handleTest} disabled={loading}>
        {loading ? "Processing..." : "Run Sentiment Alert Check"}
      </Button>

      {error && <p className="mt-3 text-sm text-rose-400">✗ {error}</p>}

      {result && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-sm">
          <p className="text-emerald-400 mb-2">✓ Processing complete</p>
          <div className="space-y-1 text-slate-300">
            <p>Symbols analyzed: {result.symbolsAnalyzed || 0}</p>
            <p>Alerts created: {result.alertsCreated || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
