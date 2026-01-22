import React from "react";
import { cn } from "@shared/lib/utils";

interface CardProps {
  title?: string;
  value?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  value,
  className = "",
  children,
}) => {
  if (children) {
    return (
      <div className={cn("rounded-lg border bg-card border-border", className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card/80 p-5 w-full rounded-lg text-center border border-border",
        className
      )}
    >
      <h3 className="text-foreground/80 text-xl font-bold mb-2">{title}</h3>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
};

export default Card;
