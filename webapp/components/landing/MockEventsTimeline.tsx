"use client";

import Card from "@/components/atoms/Card";
import { Calendar, DollarSign, Building2, TrendingUp } from "lucide-react";

type MockEvent = {
  type: "earnings" | "macro" | "fomc";
  title: string;
  description: string;
  date: string;
  symbol?: string;
};

const MOCK_EVENTS: MockEvent[] = [
  {
    type: "macro",
    title: "Employment Situation",
    description: "Monthly employment report from Bureau of Labor Statistics",
    date: "In 5 days",
  },
  {
    type: "macro",
    title: "Consumer Price Index",
    description: "Consumer Price Index - key inflation indicator",
    date: "Jan 13",
  },
  {
    type: "fomc",
    title: "FOMC Meeting",
    description:
      "Federal Reserve interest rate decision and economic projections",
    date: "Jan 28",
  },
  {
    type: "earnings",
    title: "AAPL Earnings Report",
    description: "Est. EPS: $2.65 | Est. revenue: $138.25B",
    date: "Jan 29",
    symbol: "AAPL",
  },
  {
    type: "macro",
    title: "Employment Situation",
    description: "Monthly employment report from Bureau of Labor Statistics",
    date: "Feb 6",
  },
  {
    type: "macro",
    title: "Consumer Price Index",
    description: "Consumer Price Index - key inflation indicator",
    date: "Feb 11",
  },
];

const getEventIcon = (type: string) => {
  switch (type) {
    case "earnings":
      return DollarSign;
    case "fomc":
      return Building2;
    case "macro":
      return TrendingUp;
    default:
      return Calendar;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case "earnings":
      return "text-emerald-400";
    case "fomc":
      return "text-rose-400";
    case "macro":
      return "text-amber-400";
    default:
      return "text-slate-400";
  }
};

export function MockEventsTimeline() {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Upcoming Events
      </h3>
      <div className="space-y-1">
        {MOCK_EVENTS.map((event, idx) => {
          const Icon = getEventIcon(event.type);
          const color = getEventColor(event.type);

          return (
            <div
              key={idx}
              className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {event.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.description}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-4">
                {event.date}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
