import { ReactNode } from "react";

type AlertType = "info" | "warning" | "critical" | "success";

type AlertCardProps = {
  symbol: string;
  message: string;
  type: AlertType;
  badge?: ReactNode;
};

const typeStyles: Record<AlertType, string> = {
  info: "bg-teal-500/10 border-teal-500/30",
  warning: "bg-amber-500/10 border-amber-500/30",
  critical: "bg-rose-500/10 border-rose-500/30",
  success: "bg-emerald-500/10 border-emerald-500/30",
};

/**
 * Card for displaying alert details with color-coded styling
 */
export function AlertCard({ symbol, message, type, badge }: AlertCardProps) {
  return (
    <div className={`p-3 rounded-lg border ${typeStyles[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-semibold text-slate-100">{symbol}</div>
          <div className="text-sm text-slate-300 mt-1">{message}</div>
        </div>
        {badge && <div className="ml-3">{badge}</div>}
      </div>
    </div>
  );
}
