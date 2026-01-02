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
    <Card className="bg-card border-border">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Regime Components
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vol Regime</span>
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
            <span className="text-muted-foreground">Factor Regime</span>
            <span className="font-medium text-foreground">
              {sectorRotation ? "Small-cap leadership" : "Large-cap led"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sector Regime</span>
            <span className="font-medium text-foreground">
              {sectorRotation ? "Cyclical tilt" : "Defensive tilt"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Liquidity Regime</span>
            <span className="font-medium text-foreground">Neutral</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
