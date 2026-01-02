"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import {
  ModelQualityFilter,
  type QualityFilterValue,
} from "@/components/molecules/ModelQualityFilter";
import type { EnhancedSignal, ModelQuality } from "@/types/quant";

type Props = {
  signals: EnhancedSignal[];
  modelQuality?: Record<string, ModelQuality>;
  maxSignals?: number;
};

export function TopSignalsView({
  signals,
  modelQuality = {},
  maxSignals = 10,
}: Props) {
  const [qualityFilter, setQualityFilter] = useState<QualityFilterValue>("all");

  const tradeableSignals = signals
    .filter((s) => {
      if (!s.isTradeable) return false;
      if (qualityFilter === "all") return true;
      const quality = modelQuality[s.ticker];
      if (!quality) return false;
      if (qualityFilter === "deployable") return quality.deployable;
      return quality.quality_tier === qualityFilter;
    })
    .sort((a, b) => b.quantScore - a.quantScore)
    .slice(0, maxSignals);

  const hasQualityData = Object.keys(modelQuality).length > 0;

  return (
    <div className="space-y-6">
      {/* Quality Filter */}
      {hasQualityData && (
        <ModelQualityFilter
          value={qualityFilter}
          onChange={setQualityFilter}
          filteredCount={tradeableSignals.length}
        />
      )}

      {/* Top Signals List */}
      {tradeableSignals.length > 0 ? (
        <div className="space-y-3">
          {tradeableSignals.map((signal, idx) => (
            <div
              key={signal.ticker}
              className="p-3 sm:p-5 hover:bg-muted/40 transition-all border-l-4 rounded-lg border border-border bg-card"
              style={{
                borderLeftColor:
                  signal.quantScore >= 70
                    ? "#10b981"
                    : signal.quantScore >= 50
                    ? "#3b82f6"
                    : signal.quantScore >= 30
                    ? "#f59e0b"
                    : "#64748b",
              }}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                <div className="flex-1 w-full">
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      {signal.ticker}
                    </h3>
                    <div
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                        signal.quantScore >= 70
                          ? "bg-emerald-500/20 text-emerald-400"
                          : signal.quantScore >= 50
                          ? "bg-blue-500/20 text-blue-400"
                          : signal.quantScore >= 30
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Score: {signal.quantScore}
                    </div>
                    {/* Model Quality Badge */}
                    {modelQuality[signal.ticker] && (
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium border ${
                          modelQuality[signal.ticker].quality_tier ===
                          "excellent"
                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                            : modelQuality[signal.ticker].quality_tier ===
                              "good"
                            ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                            : modelQuality[signal.ticker].quality_tier ===
                              "marginal"
                            ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                            : "bg-rose-500/20 border-rose-500/30 text-rose-400"
                        }`}
                      >
                        {modelQuality[signal.ticker].quality_tier ===
                        "excellent"
                          ? "Best"
                          : modelQuality[signal.ticker].quality_tier === "good"
                          ? "Excellent"
                          : modelQuality[signal.ticker].quality_tier ===
                            "marginal"
                          ? "Good"
                          : "Low Quality"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/80 mb-1.5 sm:mb-2">
                    {signal.signalDescription}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground italic mb-2 sm:mb-3">
                    {signal.tradingInterpretation}
                  </p>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Directional Edge
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-semibold ${
                          signal.edgeDirectional > 0
                            ? "text-teal-400"
                            : "text-rose-400"
                        }`}
                      >
                        {(signal.edgeDirectional * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Expected Directional Impact
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-semibold ${
                          signal.expectedReturn > 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {signal.expectedReturn > 0 ? "+" : ""}
                        {(signal.expectedReturn * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto sm:ml-4">
                  <p className="text-xs text-muted-foreground">Current Price</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">
                    ${signal.current_price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No tradeable signals identified today.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Check back later or lower the score threshold.
          </p>
        </Card>
      )}
    </div>
  );
}
