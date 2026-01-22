"use client";

import type { ExpectationGapAnalysis } from "@shared/lib/types";
import {
  Clock,
  Info,
  BarChart3,
  AlertTriangle,
  XCircle,
  Briefcase,
} from "lucide-react";

interface AnalysisCardProps {
  analysis: ExpectationGapAnalysis;
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const { priceMove, gap, narrative } = analysis;

  const isPositive = priceMove.changePct > 0;

  const classificationColors: Record<string, string> = {
    Fundamental: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Narrative: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    Positioning: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    Macro: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Noise: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  };

  const confidenceColors: Record<string, string> = {
    high: "text-emerald-400",
    medium: "text-teal-400",
    low: "text-zinc-400",
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden font-mono text-sm">
      {/* Header Block */}
      <div className="p-5 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">
              {narrative.ticker}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-medium border ${
                classificationColors[narrative.classification] ||
                classificationColors.Noise
              }`}
              title={
                narrative.classification === "Noise"
                  ? "Move does not warrant action - normal market fluctuation"
                  : undefined
              }
            >
              {narrative.classification}
            </span>
            <span
              className={`text-xs ${confidenceColors[narrative.confidence]}`}
            >
              {narrative.confidence.toUpperCase()} confidence
            </span>
          </div>
          <div className="text-right">
            <span
              className={`text-2xl font-bold ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {priceMove.changePct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
          <div>
            <span className="text-muted-foreground">Move:</span>{" "}
            <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
              {narrative.move}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Relative:</span>{" "}
            <span className="text-foreground">{narrative.relative}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Time horizon:</span>{" "}
            <span className="text-foreground">{narrative.timeHorizon}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Expectation source:</span>{" "}
            <span className="text-foreground">
              {narrative.expectationSource}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Read */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Primary read
          </span>
        </div>
        <p className="text-foreground leading-relaxed">
          {narrative.primaryRead}
        </p>
      </div>

      {/* Catalyst Check */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Catalyst check
          </span>
        </div>
        <p className="text-foreground leading-relaxed">
          {narrative.catalystCheck}
        </p>
      </div>

      {/* Second-Order Effects */}
      {narrative.secondOrderEffects.length > 0 && (
        <div className="p-5 border-b border-border">
          <div className="flex items-start gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Second-order effects
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {narrative.secondOrderEffects.map((effect, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded bg-muted/50 text-foreground"
              >
                {effect}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Invalidation */}
      <div className="p-5 border-b border-border bg-rose-500/5">
        <div className="flex items-start gap-2 mb-2">
          <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <span className="text-xs text-rose-400/80 uppercase tracking-wide">
            Invalidation
          </span>
        </div>
        <p className="text-rose-400/90 leading-relaxed">
          {narrative.invalidation}
        </p>
      </div>

      {/* Decision Implication */}
      <div className="p-5 border-b border-border bg-blue-500/5">
        <div className="flex items-start gap-2 mb-2">
          <Briefcase className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <span className="text-xs text-blue-400/80 uppercase tracking-wide">
            Decision implication
          </span>
        </div>
        <p className="text-blue-400/90 font-medium leading-relaxed">
          {narrative.decisionImplication}
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(narrative.generatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>{analysis.analysisId}</span>
      </div>
    </div>
  );
}
