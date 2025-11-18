import { LucideIcon } from "lucide-react";

type BadgeProps = {
  icon: LucideIcon;
  iconColor?: string;
  count: number;
  label: string;
  size?: "sm" | "md";
};

/**
 * Badge with icon, count, and label
 * Used for displaying metrics like "3 hit ±3% moves"
 */
export function Badge({
  icon: Icon,
  iconColor = "text-slate-400",
  count,
  label,
  size = "sm",
}: BadgeProps) {
  const iconSize = size === "sm" ? 14 : 16;
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className={`flex items-center gap-1.5 text-slate-300 ${textSize}`}>
      <Icon size={iconSize} className={iconColor} />
      <span>
        <span className="font-semibold">{count}</span> {label}
      </span>
    </div>
  );
}
