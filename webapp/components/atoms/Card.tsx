import React from "react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/colors";

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
      <div
        className={cn("rounded-lg border", className)}
        style={{
          backgroundColor: COLORS.bg.elevated,
          borderColor: COLORS.border.subtle,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("bg-black/30 p-5 w-full rounded-lg text-center", className)}
    >
      <h3 className="text-slate-200 text-xl font-bold mb-2">{title}</h3>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
};

export default Card;
