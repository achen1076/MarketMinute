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
    <Card className="bg-card border-border">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Market Summary
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground min-w-[70px] text-xs">
              Equities:
            </span>
            <span className="text-foreground">
              {keyDrivers && keyDrivers.length > 0
                ? keyDrivers[0]
                : "Broad market activity"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground min-w-[70px] text-xs">
              Sectors:
            </span>
            <span className="text-foreground">
              {keyDrivers && keyDrivers.length > 1
                ? keyDrivers[1]
                : "Mixed performance"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground min-w-[70px] text-xs">
              Volatility:
            </span>
            <span className="text-foreground">
              VIX {vixChangePct && vixChangePct < 0 ? "↓" : "↑"}{" "}
              {vixChangePct ? Math.abs(vixChangePct).toFixed(0) : "0"}% →{" "}
              {vixChangePct && vixChangePct < 0 ? "easing" : "rising"} risk
              premium
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground min-w-[70px] text-xs">
              Regime:
            </span>
            <span className="text-foreground">
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
