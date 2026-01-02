"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Card from "@/components/atoms/Card";
import { calculateSignalMetrics } from "@/lib/quantSignals";
import { EnhancedPredictionCard } from "@/components/molecules/EnhancedPredictionCard";
import { TopSignalsView } from "@/components/molecules/TopSignalsView";
import { QuantLabMethodology } from "@/components/molecules/QuantLabMethodology";
import { QuantLabLimitations } from "@/components/molecules/QuantLabLimitations";
import { QuantLabAvailableTickers } from "@/components/molecules/QuantLabAvailableTickers";
import { ModelQualityLegend } from "@/components/molecules/ModelQualityLegend";
import {
  ModelQualityFilter,
  type QualityFilterValue,
} from "@/components/molecules/ModelQualityFilter";
import type { Prediction, EnhancedSignal, ModelQuality } from "@/types/quant";

type Props = {
  symbols: string[];
  watchlistName?: string;
};

export function QuantLabClient({ symbols, watchlistName }: Props) {
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [fullWatchlistSignals, setFullWatchlistSignals] = useState<
    EnhancedSignal[]
  >([]);
  const [limitedWatchlistSignals, setLimitedWatchlistSignals] = useState<
    EnhancedSignal[]
  >([]);
  const [modelQuality, setModelQuality] = useState<
    Record<string, ModelQuality>
  >({});
  const [viewMode, setViewMode] = useState<"signals" | "top">("top");
  const [sortBy, setSortBy] = useState<"default" | "score" | "name">("default");
  const [qualityFilter, setQualityFilter] = useState<QualityFilterValue>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchModelQuality = async () => {
    try {
      const response = await fetch("/api/quant/model-metadata");
      if (response.ok) {
        const data = await response.json();
        setModelQuality(data.models || {});
      }
    } catch (err) {
      console.error("Failed to fetch model quality:", err);
    }
  };

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quant/predictions");

      if (response.ok) {
        const data = await response.json();
        const predictions = data.predictions || [];
        const tier = data.tier || "free";
        const watchlistSymbols: string[] = data.watchlistSymbols || symbols;
        setUserTier(tier);

        // Store all predictions
        setAllPredictions(predictions);

        // Filter to watchlist
        const watchlistFiltered = predictions.filter((p: Prediction) =>
          watchlistSymbols.includes(p.ticker)
        );
        const watchlistEnhanced = watchlistFiltered.map(calculateSignalMetrics);

        // Full watchlist for Top Signals View (TopSignalsView handles the limit)
        setFullWatchlistSignals(watchlistEnhanced);

        // Limited watchlist for All Signals View (free users: 3, paid: unlimited)
        const limitedWatchlist =
          tier === "free" ? watchlistEnhanced.slice(0, 3) : watchlistEnhanced;
        setLimitedWatchlistSignals(limitedWatchlist);
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
    fetchModelQuality();
    fetchUserTier();
  }, [symbols]);

  const getFilteredAndSortedSignals = () => {
    // First filter by search query
    let filtered = limitedWatchlistSignals.filter((s) =>
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Then filter by quality
    if (qualityFilter !== "all" && Object.keys(modelQuality).length > 0) {
      filtered = filtered.filter((s) => {
        const quality = modelQuality[s.ticker];
        if (!quality) return false;
        if (qualityFilter === "deployable") return quality.deployable;
        return quality.quality_tier === qualityFilter;
      });
    }

    // Then sort
    if (sortBy === "score") {
      return [...filtered].sort((a, b) => b.quantScore - a.quantScore);
    } else if (sortBy === "name") {
      return [...filtered].sort((a, b) => a.ticker.localeCompare(b.ticker));
    } else {
      return filtered;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">
          Loading model predictions...
        </div>
      </Card>
    );
  }

  if (error || allPredictions.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <div className="flex items-center gap-3 text-muted-foreground">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Quant Lab Signals{" "}
              {watchlistName && (
                <span className="text-muted-foreground text-base sm:text-xl">
                  - {watchlistName}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Model-generated trading signals with Quant Scores, regime
              classification, and expected metrics
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-3 items-center w-full sm:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode("top")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === "top"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                Top Signals
              </button>
              <button
                onClick={() => setViewMode("signals")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === "signals"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                All Signals
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Free Tier Info Banner */}
      {userTier === "free" && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-400 mb-1">
                Free Tier: Limited Signals
              </h3>
              <p className="text-xs text-foreground/80">
                You&apos;re viewing up to <strong>3 top signals</strong> and{" "}
                <strong>3 other signals </strong>from your watchlist. Upgrade to{" "}
                <strong>Basic</strong> for unlimited signals.{" "}
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

      {/* Model Quality Legend */}
      {Object.keys(modelQuality).length > 0 && <ModelQualityLegend />}

      {/* Filter and Sort Controls - only show for All Signals view */}
      {viewMode === "signals" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Search */}
          {userTier !== "free" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 w-40 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring"
              />
            </div>
          )}
          <ModelQualityFilter
            value={qualityFilter}
            onChange={setQualityFilter}
            filteredCount={getFilteredAndSortedSignals().length}
          />
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "default" | "score" | "name")
              }
              className="px-3 py-2 rounded-lg text-sm bg-background text-foreground border border-border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="default">Default</option>
              <option value="score">Quant Score</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* View Modes */}
      {viewMode === "top" ? (
        <div className="space-y-4">
          <TopSignalsView
            signals={fullWatchlistSignals}
            modelQuality={modelQuality}
            maxSignals={userTier === "free" ? 3 : 10}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {getFilteredAndSortedSignals().map((signal) => (
            <EnhancedPredictionCard
              key={signal.ticker}
              signal={signal}
              quality={modelQuality[signal.ticker]}
            />
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
