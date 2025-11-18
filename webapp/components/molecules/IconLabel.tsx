import { LucideIcon } from "lucide-react";

type IconLabelProps = {
  icon: LucideIcon;
  label: string;
  iconColor?: string;
  iconSize?: number;
  className?: string;
};

/**
 * Simple icon with label, commonly used for displaying stats or info
 */
export function IconLabel({
  icon: Icon,
  label,
  iconColor = "text-slate-400",
  iconSize = 16,
  className = "",
}: IconLabelProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon size={iconSize} className={iconColor} />
      <span>{label}</span>
    </div>
  );
}
