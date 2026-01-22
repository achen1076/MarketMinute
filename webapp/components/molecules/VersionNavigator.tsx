"use client";

import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface VersionNavigatorProps {
  ticker: string;
  currentIndex: number;
  totalVersions: number;
  timestamps: string[];
  onNavigate: (index: number) => void;
}

export function VersionNavigator({
  ticker,
  currentIndex,
  totalVersions,
  timestamps,
  onNavigate,
}: VersionNavigatorProps) {
  if (totalVersions <= 1) return null;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border/50">
      <button
        onClick={() => onNavigate(currentIndex - 1)}
        disabled={currentIndex === 0}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Previous version"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Prev
      </button>

      <div className="flex items-center gap-2 text-xs">
        <span className="font-bold text-foreground text-sm">{ticker}</span>
        <span className="text-muted-foreground">•</span>
        <span className="font-medium text-muted-foreground">
          Version {currentIndex + 1} of {totalVersions}
        </span>
        <span className="text-foreground/80">
          ({formatTime(timestamps[currentIndex])})
        </span>
      </div>

      <button
        onClick={() => onNavigate(currentIndex + 1)}
        disabled={currentIndex === totalVersions - 1}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Next version"
      >
        Next
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
