import Card from "@/components/atoms/Card";

interface RegimeComponentsCardProps {
  vix: number | null;
  sectorRotation: boolean;
}

export default function RegimeComponentsCard({
  vix,
  sectorRotation,
}: RegimeComponentsCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Regime Components
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Vol Regime</span>
            <span
              className={`font-medium ${
                vix && vix > 25
                  ? "text-rose-400"
                  : vix && vix > 20
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {vix && vix > 25
                ? "Elevated"
                : vix && vix > 20
                ? "Moderate"
                : "Calm"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Factor Regime</span>
            <span className="font-medium text-slate-200">
              {sectorRotation ? "Small-cap leadership" : "Large-cap led"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Sector Regime</span>
            <span className="font-medium text-slate-200">
              {sectorRotation ? "Cyclical tilt" : "Defensive tilt"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Liquidity Regime</span>
            <span className="font-medium text-slate-200">Neutral</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
