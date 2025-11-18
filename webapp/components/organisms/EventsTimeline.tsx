"use client";

import { useEffect, useState } from "react";
import Card from "@/components/atoms/Card";
import { Calendar, TrendingUp, Building2, DollarSign } from "lucide-react";

type StockEvent = {
  symbol: string;
  type: "earnings" | "dividend" | "conference" | "other";
  title: string;
  date: string;
  description?: string;
};

type MacroEvent = {
  type: "fomc" | "cpi" | "jobs" | "gdp" | "other";
  title: string;
  date: string;
  description?: string;
};

type UpcomingEvents = {
  stockEvents: StockEvent[];
  macroEvents: MacroEvent[];
  fetchedAt: number;
};

type Props = {
  symbols: string[];
};

const EVENT_TYPE_ICONS = {
  earnings: DollarSign,
  dividend: DollarSign,
  conference: Building2,
  other: Calendar,
  fomc: Building2,
  cpi: TrendingUp,
  jobs: TrendingUp,
  gdp: TrendingUp,
};

const EVENT_TYPE_COLORS = {
  earnings: "text-emerald-400",
  dividend: "text-purple-400",
  conference: "text-orange-400",
  other: "text-slate-400",
  fomc: "text-rose-400",
  cpi: "text-amber-400",
  jobs: "text-cyan-400",
  gdp: "text-indigo-400",
};

function formatDate(dateString: string): string {
  // Parse date as local time to avoid timezone issues
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();

  // Reset time to midnight for accurate day comparison
  const dateAtMidnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const nowAtMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const diffTime = dateAtMidnight.getTime() - nowAtMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function EventsTimeline({ symbols }: Props) {
  const [events, setEvents] = useState<UpcomingEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchEvents() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events?symbols=${symbols.join(",")}`);

        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await res.json();
        setEvents(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [symbols]);

  if (symbols.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          Upcoming Events
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-slate-400">Loading events...</div>
        </div>
      </Card>
    );
  }

  if (error || !events) {
    return (
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          Upcoming Events
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">{error || "No events found"}</p>
        </div>
      </Card>
    );
  }

  const allEvents = [
    ...events.stockEvents.map((e) => ({ ...e, category: "stock" as const })),
    ...events.macroEvents.map((e) => ({ ...e, category: "macro" as const })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  if (allEvents.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          Upcoming Events
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">No upcoming events</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        Upcoming Events
      </h3>

      <div className="space-y-3">
        {allEvents.map((event, idx) => {
          const Icon =
            EVENT_TYPE_ICONS[event.type as keyof typeof EVENT_TYPE_ICONS] ||
            Calendar;
          const color =
            EVENT_TYPE_COLORS[event.type as keyof typeof EVENT_TYPE_COLORS] ||
            "text-slate-400";

          return (
            <div
              key={`${event.date}-${idx}`}
              className="flex gap-3 rounded-lg bg-slate-900/60 p-3 transition-colors hover:bg-slate-900/80"
            >
              <div className={`shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-100 text-sm">
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="mt-1 text-xs text-slate-400">
                        {event.description}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-slate-400">
                    {formatDate(event.date)}
                  </div>
                </div>
                {/* {event.category === "stock" && "symbol" in event && (
                  <div className="mt-1 inline-block rounded bg-slate-800/50 px-1.5 py-0.5 text-xs font-medium text-slate-300">
                    {event.symbol}
                  </div>
                )} */}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
