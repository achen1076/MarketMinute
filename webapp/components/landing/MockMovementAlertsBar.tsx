"use client";

import { useState } from "react";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const MOCK_ALERTS = {
  bigMovers: 4,
  nearHighs: 1,
  nearLows: 0,
  details: [
    {
      symbol: "AMD",
      type: "price_move",
      message: "+4.35% today",
      direction: "up" as const,
    },
    {
      symbol: "CRM",
      type: "price_move",
      message: "-4.26% today",
      direction: "down" as const,
    },
    {
      symbol: "NOW",
      type: "price_move",
      message: "-3.75% today",
      direction: "down" as const,
    },
    {
      symbol: "TSLA",
      type: "price_move",
      message: "-2.59% today",
      direction: "down" as const,
    },
    {
      symbol: "NVDA",
      type: "near_52w_high",
      message: "Within 5% of 52-week high",
      direction: "up" as const,
    },
  ],
};

export function MockMovementAlertsBar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            Today&apos;s Alerts
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              {MOCK_ALERTS.bigMovers} hit ±3% moves
            </span>
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-amber-400" />
              {MOCK_ALERTS.nearHighs} near 52-week highs
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="grid gap-2">
            {MOCK_ALERTS.details.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {alert.direction === "up" ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {alert.symbol}
                  </span>
                </div>
                <span
                  className={`text-xs ${
                    alert.direction === "up"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {alert.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
