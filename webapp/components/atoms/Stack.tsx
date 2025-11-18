import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StackProps = {
  children: ReactNode;
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  direction?: "vertical" | "horizontal";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
  className?: string;
  as?: "div" | "section" | "ul" | "ol";
};

const verticalSpacingMap = {
  none: "",
  xs: "space-y-1",
  sm: "space-y-2",
  md: "space-y-3",
  lg: "space-y-4",
  xl: "space-y-6",
  "2xl": "space-y-8",
};

const horizontalSpacingMap = {
  none: "",
  xs: "space-x-1",
  sm: "space-x-2",
  md: "space-x-3",
  lg: "space-x-4",
  xl: "space-x-6",
  "2xl": "space-x-8",
};

export function Stack({
  children,
  spacing = "md",
  direction = "vertical",
  align,
  justify,
  wrap = false,
  className = "",
  as: Component = "div",
}: StackProps) {
  const isVertical = direction === "vertical";
  const spacingClass = isVertical
    ? verticalSpacingMap[spacing]
    : horizontalSpacingMap[spacing];

  const classes = cn(
    "flex",
    isVertical ? "flex-col" : "flex-row",
    spacingClass,
    align && `items-${align}`,
    justify && `justify-${justify}`,
    wrap && "flex-wrap",
    className
  );

  return <Component className={classes}>{children}</Component>;
}
