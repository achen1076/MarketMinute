import Card from "@/components/atoms/Card";
import type { EnhancedSignal } from "@/types/quant";

export function TopSignalsView({ signals }: { signals: EnhancedSignal[] }) {
  const tradeableSignals = signals
    .filter((s) => s.isTradeable)
    .sort((a, b) => b.quantScore - a.quantScore)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Signals List */}
      {tradeableSignals.length > 0 ? (
        <div className="space-y-3">
          {tradeableSignals.map((signal, idx) => (
            <div
              key={signal.ticker}
              className="p-5 hover:bg-slate-900/40 transition-all border-l-4 rounded-lg border border-slate-800 bg-slate-900/50"
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-slate-500">
                      #{idx + 1}
                    </span>
                    <h3 className="text-xl font-bold text-slate-100">
                      {signal.ticker}
                    </h3>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        signal.quantScore >= 70
                          ? "bg-emerald-500/20 text-emerald-400"
                          : signal.quantScore >= 50
                          ? "bg-blue-500/20 text-blue-400"
                          : signal.quantScore >= 30
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      Score: {signal.quantScore}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">
                    {signal.signalDescription}
                  </p>
                  <p className="text-xs text-slate-400 italic mb-3">
                    {signal.tradingInterpretation}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Directional Edge</p>
                      <p
                        className={`text-sm font-semibold ${
                          signal.edgeDirectional > 0
                            ? "text-teal-400"
                            : "text-rose-400"
                        }`}
                      >
                        {(signal.edgeDirectional * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        Expected Directional Impact
                      </p>
                      <p
                        className={`text-sm font-semibold ${
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
                <div className="text-right ml-4">
                  <p className="text-xs text-slate-500">Current Price</p>
                  <p className="text-lg font-bold text-slate-100">
                    ${signal.current_price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-slate-400">
            No tradeable signals identified today.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Check back later or lower the score threshold.
          </p>
        </Card>
      )}
    </div>
  );
}
