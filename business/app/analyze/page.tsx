"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckCircle, Save } from "lucide-react";
import { AnalysisCard } from "@/components/AnalysisCard";
import type { ExpectationGapAnalysis } from "@/lib/types";

export default function AnalyzePage() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analysis, setAnalysis] = useState<ExpectationGapAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setSaved(false);

    try {
      const res = await fetch(
        `/api/analyze?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze symbol");
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    if (!analysis || saving || saved) return;

    setSaving(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save card");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save card");
    } finally {
      setSaving(false);
    }
  };

  const quickSymbols = ["AAPL", "NVDA", "TSLA", "GOOGL", "META", "MSFT"];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Expectation Gap Analysis
        </h1>
        <p className="text-muted-foreground mb-6">
          Tell me what moved, why it moved, and whether the move makes sense.
        </p>

        <form onSubmit={handleAnalyze} className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Enter ticker symbol (e.g., AAPL)"
              className="w-full pl-12 pr-32 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !symbol.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </button>
          </div>
        </form>

        {/* Quick Symbols */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Quick:</span>
          {quickSymbols.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSymbol(s);
              }}
              className="px-3 py-1 text-sm rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-8 p-12 rounded-xl border border-border bg-card text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Analyzing {symbol}...
          </h3>
          <p className="text-muted-foreground text-sm">
            Fetching price data, news sentiment, sector correlations, and
            building narrative...
          </p>
        </div>
      )}

      {/* Analysis Result */}
      {analysis && !loading && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleSaveCard}
              disabled={saving || saved}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved to Library
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save to Library
                </>
              )}
            </button>
          </div>
          <AnalysisCard analysis={analysis} />
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && (
        <div className="p-12 rounded-xl border border-dashed border-border text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Enter a ticker to analyze
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            The Expectation Gap Engine will analyze the stock&apos;s move,
            classify what&apos;s driving it, and provide actionable insights
            like a senior analyst.
          </p>
        </div>
      )}
    </div>
  );
}
