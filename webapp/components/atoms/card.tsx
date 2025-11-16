import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  value?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, value, className = "", children }) => {
  // If children are provided, render as a generic container
  if (children) {
    return (
      <div
        className={cn("rounded-lg border border-slate-800 bg-slate-900/50", className)}
      >
        {children}
      </div>
    );
  }

  // Otherwise, render as a metric card
  return (
    <div
      className={cn("bg-black/30 p-5 w-full rounded-lg text-center", className)}
    >
      <h3 className="text-rok-purple-light text-xl font-bold mb-2">{title}</h3>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
};

export default Card;
