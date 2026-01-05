"use client";

export type QualityFilterValue =
  | "all"
  | "deployable"
  | "excellent"
  | "good"
  | "marginal"
  | "neutral"
  | "poor";

type Props = {
  value: QualityFilterValue;
  onChange: (value: QualityFilterValue) => void;
  filteredCount?: number;
};

export function ModelQualityFilter({ value, onChange, filteredCount }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Filter by Model Quality:
      </span>
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as QualityFilterValue)}
          className="px-3 py-2 rounded-lg text-sm bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1 sm:flex-none sm:min-w-[240px]"
        >
          <option value="all">All Models</option>
          <option value="deployable">Recommended (Best + Excellent)</option>
          <option value="excellent">Best</option>
          <option value="good">Excellent</option>
          <option value="marginal">Good</option>
          <option value="neutral">Fair</option>
          <option value="poor">Low Quality</option>
        </select>
        {value !== "all" && filteredCount !== undefined && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            ({filteredCount} signals)
          </span>
        )}
      </div>
    </div>
  );
}
