import { LucideIcon } from "lucide-react";
import Card from "./Card";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 text-slate-400">
        <Icon size={20} className="shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
          {children}
        </div>
      </div>
    </Card>
  );
}
