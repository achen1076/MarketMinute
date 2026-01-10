"use client";

export function ModelData() {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="text-muted-foreground">
          <span className="font-medium">Lookahead Window:</span> 10 trading days
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium">Models Last Retrained:</span> January 5,
          2026 (weekly retrain)
        </span>
      </div>
    </div>
  );
}
