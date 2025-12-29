"use client";

export type QualityFilterValue =
  | "all"
  | "deployable"
  | "excellent"
  | "good"
  | "marginal"
  | "poor";

type Props = {
  value: QualityFilterValue;
  onChange: (value: QualityFilterValue) => void;
  filteredCount?: number;
};

export function ModelQualityFilter({ value, onChange, filteredCount }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-slate-500">Filter by Model Quality:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as QualityFilterValue)}
        className="px-3 py-2 rounded-lg text-sm bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
      >
        <option value="all">All Models</option>
        <option value="deployable">Recommended (Best + Excellent)</option>
        <option value="excellent">Best</option>
        <option value="good">Excellent</option>
        <option value="marginal">Good</option>
        <option value="poor">Low Quality</option>
      </select>
      {value !== "all" && filteredCount !== undefined && (
        <span className="text-xs text-slate-400">
          ({filteredCount} signals)
        </span>
      )}
    </div>
  );
}
