"use client";

export function ModelData() {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="text-muted-foreground">
          <span className="font-medium">Lookahead Window:</span> 5 trading days
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium">Models Last Retrained:</span> October 25, 2026
          (weekly retrain)
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium">Validation:</span> Purged walk-forward,
          out-of-sample
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium">Signals:</span> Market-relative (vs
          S&amp;P 500) residual momentum, beta, fractional differencing
        </span>
      </div>
    </div>
  );
}
