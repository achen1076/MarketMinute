import { LucideIcon } from "lucide-react";

type SectionHeaderProps = {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  count?: number;
  size?: "sm" | "md" | "lg";
};

export function SectionHeader({
  icon: Icon,
  iconColor = "text-slate-400",
  title,
  count,
  size = "md",
}: SectionHeaderProps) {
  const iconSize = size === "sm" ? 16 : size === "md" ? 18 : 20;
  const textSize =
    size === "sm" ? "text-base" : size === "md" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-2">
      <Icon size={iconSize} className={iconColor} />
      <h3 className={`font-semibold text-slate-200 ${textSize}`}>
        {title}
        {count !== undefined && ` (${count})`}
      </h3>
    </div>
  );
}
