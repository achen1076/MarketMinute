import Card from "@/components/atoms/Card";
import type { EnhancedSignal } from "@/types/quant";

export function EnhancedPredictionCard({ signal }: { signal: EnhancedSignal }) {
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
      : "text-slate-400";

  const scoreBarColor =
    quantScore >= 70
      ? "bg-emerald-500"
      : quantScore >= 50
      ? "bg-blue-500"
      : quantScore >= 30
      ? "bg-amber-500"
      : "bg-slate-500";

  return (
    <Card className="p-5 hover:bg-slate-900/20 transition-all hover:border-slate-700">
      {/* Header with Quant Score */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">{ticker}</h3>
          <p className="text-sm text-slate-300">${current_price.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            {rawQuantScore !== null ? "Quant Score" : "Quant Score"}
          </p>
          <div className="flex items-baseline justify-end gap-1">
            <p className={`text-3xl font-bold ${scoreColor}`}>{quantScore}</p>
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
            <p className="text-xs text-slate-500 mt-0.5">
              Raw: {rawQuantScore}
            </p>
          )}
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full ${scoreBarColor} transition-all duration-300`}
            style={{ width: `${quantScore}%` }}
          />
        </div>
      </div>

      {/* Signal Description */}
      <div className="mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700 min-h-[88px] flex flex-col justify-center">
        <p className="text-sm text-slate-300 mb-2">{signalDescription}</p>
        <p className="text-xs text-slate-400 italic">{tradingInterpretation}</p>
      </div>

      {/* Regime Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          {regime}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-slate-800/30">
          <p className="text-xs text-slate-500 mb-1">Directional Edge</p>
          <p
            className={`text-lg font-bold ${
              edgeDirectional > 0 ? "text-teal-400" : "text-rose-400"
            }`}
          >
            {(edgeDirectional * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/30">
          <p className="text-xs text-slate-500 mb-1">
            Expected Directional Impact
          </p>
          <p
            className={`text-lg font-bold ${
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
            <span className="text-xs text-slate-500">
              {raw_signal} → {signal.signal}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-500">UP</div>
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
              <div className="text-slate-500">NEUTRAL</div>
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
              <div className="text-slate-500">DOWN</div>
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
        <p className="text-xs text-slate-500 mb-2">
          {hasNewsAdjustment
            ? "Final Probability Distribution:"
            : "Probability Distribution:"}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-16">Higher:</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
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
            <span className="text-xs text-slate-400 w-16">Neutral:</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-slate-500"
                style={{ width: `${prob_neutral * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold w-12 text-right">
              {(prob_neutral * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-16">Lower:</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
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
      <div className="pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {signal.signal === "NEUTRAL"
              ? "Neutral Certainty:"
              : "Directional Confidence:"}
          </span>
          <span
            className={`font-semibold ${
              signal.signal === "NEUTRAL"
                ? "text-slate-400"
                : directionalConfidence >= 0.7
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {(directionalConfidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
