type Severity = "info" | "warning" | "critical" | "success";

type StatusBadgeProps = {
  severity: Severity;
  label: string;
};

const severityStyles: Record<Severity, string> = {
  info: "bg-blue-500/20 text-blue-400",
  warning: "bg-amber-500/20 text-amber-400",
  critical: "bg-rose-500/20 text-rose-400",
  success: "bg-emerald-500/20 text-emerald-400",
};

export function StatusBadge({ severity, label }: StatusBadgeProps) {
  return (
    <span className={`text-xs px-2 py-1 rounded ${severityStyles[severity]}`}>
      {label}
    </span>
  );
}
