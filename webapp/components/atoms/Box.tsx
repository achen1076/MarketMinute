import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BoxProps = {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  width?: "full" | "container" | "narrow" | "wide";
  display?: "block" | "flex" | "inline-flex";
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  as?: "div" | "section" | "article" | "main" | "aside";
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

const widthMap = {
  full: "w-full",
  container: "max-w-7xl mx-auto w-full",
  narrow: "max-w-3xl mx-auto w-full",
  wide: "max-w-screen-2xl mx-auto w-full",
};

const gapMap = {
  none: "",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
};

export function Box({
  children,
  padding = "none",
  width = "full",
  display = "block",
  direction = "row",
  align,
  justify,
  gap = "none",
  className = "",
  as: Component = "div",
}: BoxProps) {
  const classes = cn(
    paddingMap[padding],
    widthMap[width],
    display === "flex" && "flex",
    display === "inline-flex" && "inline-flex",
    display === "flex" && direction === "col" && "flex-col",
    display === "flex" && align && `items-${align}`,
    display === "flex" && justify && `justify-${justify}`,
    display === "flex" && gapMap[gap],
    className
  );

  return <Component className={classes}>{children}</Component>;
}
