import React from "react";
import { cn } from "@shared/lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: "default" | "secondary";
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  bold?: boolean;
}

const Label: React.FC<LabelProps> = ({
  variant = "default",
  size = "md",
  className,
  bold = false,
  ...props
}) => {
  const sizeMap = {
    sm: "text-sm",
    md: "text-md",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
  };

  const variantMap = {
    default: "text-foreground",
    secondary: "text-muted-foreground",
  };

  return (
    <label
      className={cn(
        "block font-medium font-rockford",
        sizeMap[size],
        variantMap[variant],
        bold && "font-bold",
        className
      )}
      {...props}
    />
  );
};

export default Label;
