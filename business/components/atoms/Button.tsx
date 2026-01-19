import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  disabled,
  children,
  ...props
}) => {
  const globalStyle =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 border-2 border-border hover:cursor-pointer";

  const variantMap = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary min-w-[120px]",
    secondary:
      "bg-muted text-foreground hover:bg-muted/80 focus:ring-muted min-w-[120px]",
  };

  const sizeMap = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        globalStyle,
        variantMap[variant],
        sizeMap[size],

        fullWidth && "w-full",

        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
