import Card from "@/components/atoms/Card";
import type { EnhancedSignal } from "@/types/quant";

export function EnhancedPredictionCard({ signal }: { signal: EnhancedSignal }) {
  const {
    ticker,
    current_price,
    quantScore,
    edgeDirectional,
    regime,
    expectedReturn,
    signalDescription,
    tradingInterpretation,
    prob_up,
    prob_down,
    prob_neutral,
    directionalConfidence,
  } = signal;

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
            Quant Score
          </p>
          <p className={`text-3xl font-bold ${scoreColor}`}>{quantScore}</p>
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
      <div className="mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700">
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

      {/* Probability Distribution */}
      <div className="mb-3">
        <p className="text-xs text-slate-500 mb-2">Probability Distribution:</p>
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
