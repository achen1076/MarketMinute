import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  paddingX?: "none" | "sm" | "md" | "lg";
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  center?: boolean;
  className?: string;
  as?: "div" | "section" | "main" | "article";
};

const sizeMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-screen-2xl",
  full: "max-w-full",
};

const paddingXMap = {
  none: "",
  sm: "px-3",
  md: "px-4",
  lg: "px-6",
};

const paddingYMap = {
  none: "",
  sm: "py-3",
  md: "py-4",
  lg: "py-6",
  xl: "py-8",
  "2xl": "py-12",
};

export function Container({
  children,
  size = "lg",
  paddingX = "md",
  paddingY = "none",
  center = true,
  className = "",
  as: Component = "div",
}: ContainerProps) {
  const classes = cn(
    "w-full",
    sizeMap[size],
    paddingXMap[paddingX],
    paddingYMap[paddingY],
    center && "mx-auto",
    className
  );

  return <Component className={classes}>{children}</Component>;
}
