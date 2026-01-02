"use client";

export function ModelQualityLegend() {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="text-muted-foreground font-medium">
          Model Quality:
        </span>
        <span className="inline-flex items-center gap-1 text-emerald-400">
          Best
        </span>
        <span className="inline-flex items-center gap-1 text-blue-400">
          Excellent
        </span>
        <span className="inline-flex items-center gap-1 text-amber-400">
          Good
        </span>
        <span className="inline-flex items-center gap-1 text-rose-400">
          Low Quality
        </span>
        <span className="text-muted-foreground italic ml-2">
          Note: Quality ratings are updated each time models are retrained.
          (20-30% excellent or better is normal)
        </span>
      </div>
    </div>
  );
}
