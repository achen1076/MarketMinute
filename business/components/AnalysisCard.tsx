"use client";

import type { ExpectationGapAnalysis } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Clock,
  Activity,
  Target,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface AnalysisCardProps {
  analysis: ExpectationGapAnalysis;
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { priceMove, gap, narrative, secondOrder } = analysis;

  const isPositive = priceMove.changePct > 0;
  const classificationColors: Record<string, string> = {
    fundamental: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    narrative: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    positioning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    macro: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    noise: "bg-muted text-muted-foreground border-border",
  };

  const confidenceColors: Record<string, string> = {
    high: "text-emerald-400",
    medium: "text-amber-400",
    low: "text-muted-foreground",
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Headline */}
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              {narrative.headline}
            </h2>

            {/* Classification Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${
                  classificationColors[gap.classification]
                }`}
              >
                {gap.classification.charAt(0).toUpperCase() +
                  gap.classification.slice(1)}
              </span>

              <span
                className={`text-sm ${confidenceColors[narrative.confidence]}`}
              >
                {narrative.confidence.charAt(0).toUpperCase() +
                  narrative.confidence.slice(1)}{" "}
                confidence
              </span>
            </div>
          </div>

          {/* Price Change */}
          <div className="text-right shrink-0">
            <div
              className={`text-3xl font-bold ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {priceMove.changePct.toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">
              ${priceMove.currentPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
        {narrative.keyMetrics.slice(0, 4).map((metric, i) => (
          <div key={i} className="bg-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {metric.label}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {metric.value}
            </div>
            {metric.context && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {metric.context}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Expandable Content */}
      <div className={expanded ? "block" : "hidden"}>
        {/* What Happened */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">What Happened</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {narrative.whatHappened}
          </p>
        </div>

        {/* Why */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-foreground">Why</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {narrative.why}
          </p>

          {/* Evidence Points */}
          {gap.evidencePoints.length > 0 && (
            <div className="mt-4 space-y-2">
              {gap.evidencePoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{point}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Second-Order Context */}
        {(secondOrder.correlatedTickers.length > 0 ||
          secondOrder.macroFactors.some((f) => Math.abs(f.move) > 0.5)) && (
          <div className="p-6 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-foreground">Market Context</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Correlated Movers */}
              {secondOrder.correlatedTickers.length > 0 && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Sector Peers
                  </div>
                  <div className="space-y-2">
                    {secondOrder.correlatedTickers.map((ticker, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <span className="font-medium text-foreground">
                          {ticker.symbol}
                        </span>
                        <span
                          className={
                            ticker.move > 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {ticker.move > 0 ? "+" : ""}
                          {ticker.move.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Macro Factors */}
              {secondOrder.macroFactors.filter((f) => Math.abs(f.move) > 0.3)
                .length > 0 && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Macro Backdrop
                  </div>
                  <div className="space-y-2">
                    {secondOrder.macroFactors
                      .filter((f) => Math.abs(f.move) > 0.3)
                      .slice(0, 3)
                      .map((factor, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <span className="text-muted-foreground">
                            {factor.factor}
                          </span>
                          <span
                            className={
                              factor.move > 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {factor.move > 0 ? "+" : ""}
                            {factor.move.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What Matters Next */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-foreground">What Matters Next</h3>
          </div>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {narrative.whatMattersNext}
          </div>
        </div>

        {/* Invalidation Thesis */}
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-foreground">
              When This Thesis Breaks
            </h3>
          </div>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {narrative.invalidationThesis}
          </p>
        </div>

        {/* Caveats */}
        {narrative.caveats.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/20">
            <div className="flex flex-wrap gap-2">
              {narrative.caveats.map((caveat, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                >
                  <AlertCircle className="w-3 h-3" />
                  {caveat}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show Full Analysis
          </>
        )}
      </button>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Generated{" "}
          {new Date(narrative.generatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>ID: {analysis.analysisId}</span>
      </div>
    </div>
  );
}
