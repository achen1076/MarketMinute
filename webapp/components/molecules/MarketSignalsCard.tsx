import Card from "@/components/atoms/Card";

interface MarketSignalsCardProps {
  sectorRotation: boolean;
  indexMove: boolean;
  volSpike: boolean;
  macroSurprise: boolean;
}

export default function MarketSignalsCard({
  sectorRotation,
  indexMove,
  volSpike,
  macroSurprise,
}: MarketSignalsCardProps) {
  const hasSignals = sectorRotation || indexMove || volSpike || macroSurprise;

  return (
    <Card className="bg-card border-border">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Market Signals
        </h3>
        {!hasSignals ? (
          <p className="text-sm text-muted-foreground">No active signals</p>
        ) : (
          <div className="space-y-2">
            {sectorRotation && (
              <div className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">
                      Sector Rotation
                    </span>
                    <span className="text-xs text-purple-400">High</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Often precedes broadening breadth
                  </p>
                </div>
              </div>
            )}
            {indexMove && (
              <div className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">
                      Index Move
                    </span>
                    <span className="text-xs text-blue-400">Moderate</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Directional move detected
                  </p>
                </div>
              </div>
            )}
            {volSpike && (
              <div className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">
                      Vol Spike
                    </span>
                    <span className="text-xs text-rose-400">High</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Risk premium adjustment
                  </p>
                </div>
              </div>
            )}
            {macroSurprise && (
              <div className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">
                      Macro Event
                    </span>
                    <span className="text-xs text-amber-400">Moderate</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Economic data release
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
