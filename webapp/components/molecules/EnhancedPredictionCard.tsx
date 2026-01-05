import Card from "@/components/atoms/Card";
import type { EnhancedSignal, ModelQuality } from "@/types/quant";
import { cn } from "@/lib/utils";

type Props = {
  signal: EnhancedSignal;
  quality?: ModelQuality;
  hover?: boolean;
};

export function EnhancedPredictionCard({
  signal,
  quality,
  hover = true,
}: Props) {
  const {
    ticker,
    current_price,
    quantScore,
    rawQuantScore,
    edgeDirectional,
    regime,
    expectedReturn,
    signalDescription,
    tradingInterpretation,
    prob_up,
    prob_down,
    prob_neutral,
    directionalConfidence,
    raw_prob_up,
    raw_prob_down,
    raw_prob_neutral,
    raw_signal,
    news_count,
  } = signal;

  const hasNewsAdjustment = news_count && news_count > 0;
  const quantScoreDiff =
    rawQuantScore !== null ? quantScore - rawQuantScore : 0;

  const scoreColor =
    quantScore >= 70
      ? "text-emerald-400"
      : quantScore >= 50
      ? "text-blue-400"
      : quantScore >= 30
      ? "text-amber-400"
      : "text-muted-foreground";

  const scoreBarColor =
    quantScore >= 70
      ? "bg-emerald-500"
      : quantScore >= 50
      ? "bg-blue-500"
      : quantScore >= 30
      ? "bg-amber-500"
      : "bg-slate-500";

  // Model quality styling
  const getQualityBadge = () => {
    if (!quality) return null;

    const tierConfig = {
      excellent: {
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: "",
        label: "Best",
      },
      good: {
        bg: "bg-blue-500/20",
        border: "border-blue-500/30",
        text: "text-blue-400",
        icon: "",
        label: "Excellent",
      },
      marginal: {
        bg: "bg-amber-500/20",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: "",
        label: "Good",
      },
      poor: {
        bg: "bg-rose-500/20",
        border: "border-rose-500/30",
        text: "text-rose-400",
        icon: "",
        label: "Low Quality",
      },
    };

    const config = tierConfig[quality.quality_tier];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.border} ${config.text} border`}
      >
        {/* <span>{config.icon}</span> */}
        <span>{config.label}</span>
      </span>
    );
  };

  // Card border color based on quality
  const cardBorderClass = quality
    ? quality.quality_tier === "excellent"
      ? "border-emerald-500/30 hover:border-emerald-500/50"
      : quality.quality_tier === "good"
      ? "border-blue-500/30 hover:border-blue-500/50"
      : quality.quality_tier === "marginal"
      ? "border-amber-500/30 hover:border-amber-500/50"
      : "border-rose-500/30 hover:border-rose-500/50"
    : "hover:border-border";

  return (
    <Card
      className={`p-3 sm:p-5 transition-all ${cardBorderClass} ${cn(
        hover && "hover:bg-muted/20"
      )}`}
    >
      {/* Model Quality Badge */}
      {quality && (
        <div className="flex items-center justify-between mb-3">
          {getQualityBadge()}
          {/* {quality.sharpe_ratio > 0 && (
            <span className="text-xs text-slate-500">
              Sharpe: {quality.sharpe_ratio.toFixed(1)} | PF:{" "}
              {quality.profit_factor?.toFixed(1) ?? "∞"}
            </span>
          )} */}
        </div>
      )}

      {/* Header with Quant Score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-0 ">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {ticker}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            ${current_price.toFixed(2)}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {rawQuantScore !== null ? "Quant Score" : "Quant Score"}
          </p>
          <div className="flex items-baseline justify-start sm:justify-end gap-1">
            <p className={`text-2xl sm:text-3xl font-bold ${scoreColor}`}>
              {quantScore}
            </p>
            {rawQuantScore !== null && quantScoreDiff !== 0 && (
              <span
                className={`text-sm font-semibold ${
                  quantScoreDiff > 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ({quantScoreDiff > 0 ? "+" : ""}
                {quantScoreDiff})
              </span>
            )}
          </div>
          {rawQuantScore !== null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Raw: {rawQuantScore}
            </p>
          )}
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full ${scoreBarColor} transition-all duration-300`}
            style={{ width: `${quantScore}%` }}
          />
        </div>
      </div>

      {/* Signal Description */}
      <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg bg-muted/40 border border-border flex flex-col justify-center">
        <p className="text-xs sm:text-sm text-foreground/80 mb-1.5 sm:mb-2">
          {signalDescription}
        </p>
        <p className="text-[11px] sm:text-xs text-muted-foreground italic">
          {tradingInterpretation}
        </p>
      </div>

      {/* Regime Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          {regime}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 rounded-lg bg-muted/30">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
            Directional Edge
          </p>
          <p
            className={`text-sm sm:text-lg font-bold ${
              edgeDirectional > 0 ? "text-teal-400" : "text-rose-400"
            }`}
          >
            {(edgeDirectional * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-2 sm:p-3 rounded-lg bg-muted/30">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
            Expected Directional Impact
          </p>
          <p
            className={`text-sm sm:text-lg font-bold ${
              expectedReturn > 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {expectedReturn > 0 ? "+" : ""}
            {(expectedReturn * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* News Impact Comparison (if news was applied) */}
      {hasNewsAdjustment && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-blue-400 font-semibold">
              📰 News Impact
            </p>
            <span className="text-xs text-muted-foreground">
              {raw_signal} → {signal.signal}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">UP</div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">
                  {(raw_prob_up! * 100).toFixed(0)}%
                </span>
                <span className="text-blue-400">→</span>
                <span className="text-emerald-400 font-semibold">
                  {(prob_up * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">NEUTRAL</div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">
                  {(raw_prob_neutral! * 100).toFixed(0)}%
                </span>
                <span className="text-blue-400">→</span>
                <span className="text-slate-400 font-semibold">
                  {(prob_neutral * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">DOWN</div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">
                  {(raw_prob_down! * 100).toFixed(0)}%
                </span>
                <span className="text-blue-400">→</span>
                <span className="text-rose-400 font-semibold">
                  {(prob_down * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Probability Distribution */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-2">
          {hasNewsAdjustment
            ? "Final Probability Distribution:"
            : "Probability Distribution:"}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Higher:</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${prob_up * 100}%` }}
              />
            </div>
            <span className="text-xs text-emerald-400 font-semibold w-12 text-right">
              {(prob_up * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Neutral:</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-slate-500"
                style={{ width: `${prob_neutral * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-semibold w-12 text-right">
              {(prob_neutral * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Lower:</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-rose-400"
                style={{ width: `${prob_down * 100}%` }}
              />
            </div>
            <span className="text-xs text-rose-400 font-semibold w-12 text-right">
              {(prob_down * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Footer */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {signal.signal === "NEUTRAL"
              ? "Neutral Certainty:"
              : "Directional Confidence:"}
          </span>
          <span
            className={`font-semibold ${
              signal.signal === "NEUTRAL"
                ? "text-muted-foreground"
                : directionalConfidence >= 0.7
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {(directionalConfidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Quality Disclaimer for marginal/poor models */}
      {quality &&
        (quality.quality_tier === "marginal" ||
          quality.quality_tier === "poor") && (
          <div
            className={`mt-3 p-2 rounded text-xs ${
              quality.quality_tier === "poor"
                ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
            }`}
          >
            <div className="flex items-start gap-2">
              <span>{quality.quality_tier === "poor" ? "⚠️" : "⚡"}</span>
              <div>
                <span className="font-semibold">
                  {quality.quality_tier === "poor"
                    ? "Low Quality Model"
                    : "Good Model"}
                </span>
                <p className="mt-0.5 text-[10px] opacity-80">
                  {quality.quality_tier === "poor"
                    ? "This model has historically underperformed. Use for informational purposes only."
                    : "This model shows modest performance. Combine with other analysis."}
                </p>
              </div>
            </div>
          </div>
        )}
    </Card>
  );
}
