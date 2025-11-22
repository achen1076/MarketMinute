import Card from "@/components/atoms/Card";

interface MarketSummaryCardProps {
  keyDrivers: string[];
  vixChangePct: number | null;
  vix: number | null;
  sectorRotation: boolean;
}

export default function MarketSummaryCard({
  keyDrivers,
  vixChangePct,
  vix,
  sectorRotation,
}: MarketSummaryCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Market Summary
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-slate-500 min-w-[70px] text-xs">
              Equities:
            </span>
            <span className="text-slate-200">
              {keyDrivers && keyDrivers.length > 0
                ? keyDrivers[0]
                : "Broad market activity"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-500 min-w-[70px] text-xs">
              Sectors:
            </span>
            <span className="text-slate-200">
              {keyDrivers && keyDrivers.length > 1
                ? keyDrivers[1]
                : "Mixed performance"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-500 min-w-[70px] text-xs">
              Volatility:
            </span>
            <span className="text-slate-200">
              VIX {vixChangePct && vixChangePct < 0 ? "↓" : "↑"}{" "}
              {vixChangePct ? Math.abs(vixChangePct).toFixed(0) : "0"}% →{" "}
              {vixChangePct && vixChangePct < 0 ? "easing" : "rising"} risk
              premium
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-500 min-w-[70px] text-xs">Regime:</span>
            <span className="text-slate-200">
              {vix && vix > 25
                ? "Risk-off"
                : sectorRotation
                ? "Risk-on rotation"
                : "Neutral"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
