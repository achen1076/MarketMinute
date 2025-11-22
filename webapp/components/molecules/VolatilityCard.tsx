import Card from "@/components/atoms/Card";

interface VolatilityCardProps {
  vix: number | null;
  vixChangePct: number | null;
  realizedVol: number | null;
}

export default function VolatilityCard({
  vix,
  vixChangePct,
  realizedVol,
}: VolatilityCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Volatility
        </h3>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-400">VIX</span>
            <span className="text-2xl font-bold text-slate-100">
              {vix?.toFixed(2) || "--"}
            </span>
          </div>
          {vixChangePct !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Change</span>
              <span
                className={
                  vixChangePct > 0
                    ? "text-rose-400 font-medium"
                    : "text-emerald-400 font-medium"
                }
              >
                {vixChangePct > 0 ? "+" : ""}
                {vixChangePct.toFixed(1)}%
              </span>
            </div>
          )}
          {realizedVol !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Realized</span>
              <span className="text-slate-100 font-medium">
                {realizedVol.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
