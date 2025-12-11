"use client";

import { useState, useEffect } from "react";
import Card from "@/components/atoms/Card";
import { calculateSignalMetrics } from "@/lib/quantSignals";
import { EnhancedPredictionCard } from "@/components/molecules/EnhancedPredictionCard";
import { TopSignalsView } from "@/components/molecules/TopSignalsView";
import { QuantLabMethodology } from "@/components/molecules/QuantLabMethodology";
import { QuantLabLimitations } from "@/components/molecules/QuantLabLimitations";
import { QuantLabAvailableTickers } from "@/components/molecules/QuantLabAvailableTickers";
import type { Prediction, EnhancedSignal } from "@/types/quant";

type Props = {
  symbols: string[];
  watchlistName?: string;
};

export function QuantLabClient({ symbols, watchlistName }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [enhancedSignals, setEnhancedSignals] = useState<EnhancedSignal[]>([]);
  const [viewMode, setViewMode] = useState<"signals" | "top">("top");
  const [sortBy, setSortBy] = useState<"default" | "score" | "name">("default");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quant/predictions");

      if (response.ok) {
        const data = await response.json();
        const allPredictions = data.predictions || [];
        const filtered = allPredictions.filter((p: Prediction) =>
          symbols.includes(p.ticker)
        );
        setPredictions(filtered);
        const enhanced = filtered.map(calculateSignalMetrics);
        setEnhancedSignals(enhanced);
      } else {
        setError("Failed to load predictions");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserTier = async () => {
    try {
      const response = await fetch("/api/subscription/status");
      if (response.ok) {
        const data = await response.json();
        setUserTier(data.usage.tier);
      }
    } catch (err) {
      console.error("Failed to fetch user tier:", err);
    }
  };

  useEffect(() => {
    fetchPredictions();
    fetchUserTier();
  }, [symbols]);

  const getSortedSignals = () => {
    if (sortBy === "score") {
      return [...enhancedSignals].sort((a, b) => b.quantScore - a.quantScore);
    } else if (sortBy === "name") {
      return [...enhancedSignals].sort((a, b) =>
        a.ticker.localeCompare(b.ticker)
      );
    } else {
      return enhancedSignals;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-slate-400">Loading model predictions...</div>
      </Card>
    );
  }

  if (error || predictions.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <div className="flex items-center gap-3 text-slate-400">
            <div>
              <div className="font-semibold">No predictions available</div>
              <div className="text-md mt-3 space-y-2">
                <p className="text-sm">This means:</p>
                <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                  <li>No watchlist is selected</li>
                  <li>
                    Your watchlist symbols are not in the trained model (see
                    available tickers below)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
        <QuantLabAvailableTickers />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Quant Lab Signals{" "}
              {watchlistName && (
                <span className="text-slate-400">- {watchlistName}</span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Model-generated trading signals with Quant Scores, regime
              classification, and expected metrics
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("top")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "top"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800"
                }`}
              >
                Top Signals
              </button>
              <button
                onClick={() => setViewMode("signals")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "signals"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800"
                }`}
              >
                All Signals
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Dropdown - only show for All Signals view */}
      {viewMode === "signals" && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-slate-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "default" | "score" | "name")
            }
            className="px-3 py-2 rounded-lg text-sm bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="default">Default</option>
            <option value="score">Quant Score</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      )}

      {/* Free Tier Limitation Banner */}
      {userTier === "free" && viewMode === "signals" && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-400 mb-1">
                Free Tier: Limited Watchlist Signals
              </h3>
              <p className="text-xs text-slate-300">
                You&apos;re viewing the first <strong>3 signals</strong> from
                your watchlist. Upgrade to <strong>Basic</strong> to see all
                signals from your watchlist.{" "}
                <a
                  href="/settings"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  View Plans
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Modes */}
      {viewMode === "top" ? (
        <div className="space-y-4">
          <TopSignalsView signals={enhancedSignals} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {getSortedSignals().map((signal) => (
            <EnhancedPredictionCard key={signal.ticker} signal={signal} />
          ))}
        </div>
      )}

      {/* Methodology */}
      <QuantLabMethodology />

      {/* Limitations */}
      <QuantLabLimitations />

      {/* Available Tickers */}
      <QuantLabAvailableTickers />
    </div>
  );
}
