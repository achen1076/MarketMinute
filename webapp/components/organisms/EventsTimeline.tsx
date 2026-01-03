"use client";

import { useEffect, useState, useRef } from "react";
import Card from "@/components/atoms/Card";
import {
  Calendar,
  TrendingUp,
  Building2,
  DollarSign,
  Rocket,
  Pill,
  UserRound,
} from "lucide-react";

type StockEvent = {
  symbol: string;
  type: "earnings" | "dividend" | "conference" | "other";
  title: string;
  date: string;
  description?: string;
  source?: "api" | "news";
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

// Enhanced icons for news-detected events
const getEventIcon = (type: string, title: string) => {
  // Check title for specific event types
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("product launch") || lowerTitle.includes("launch")) {
    return Rocket;
  }
  if (
    lowerTitle.includes("fda") ||
    lowerTitle.includes("regulatory") ||
    lowerTitle.includes("approval")
  ) {
    return Pill;
  }
  if (
    lowerTitle.includes("investor day") ||
    lowerTitle.includes("analyst day") ||
    lowerTitle.includes("conference")
  ) {
    return UserRound;
  }

  return EVENT_TYPE_ICONS[type as keyof typeof EVENT_TYPE_ICONS] || Calendar;
};

const getEventColor = (type: string, title: string) => {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("product launch") || lowerTitle.includes("launch")) {
    return "text-blue-400";
  }
  if (lowerTitle.includes("fda") || lowerTitle.includes("regulatory")) {
    return "text-green-400";
  }
  if (
    lowerTitle.includes("investor day") ||
    lowerTitle.includes("analyst day")
  ) {
    return "text-orange-400";
  }

  return (
    EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] ||
    "text-slate-400"
  );
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

// Client-side cache (24-hour TTL, same as server)
const CLIENT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const clientCache = new Map<
  string,
  { data: UpcomingEvents; timestamp: number }
>();

export function EventsTimeline({ symbols }: Props) {
  const [events, setEvents] = useState<UpcomingEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInitiated = useRef<string | null>(null);

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    // Prevent duplicate fetch for same symbols
    const symbolsKey = symbols.sort().join(",");
    if (fetchInitiated.current === symbolsKey) return;
    fetchInitiated.current = symbolsKey;

    async function fetchEvents() {
      try {
        setLoading(true);

        // Check client cache first
        const cacheKey = symbols.sort().join(",");
        const now = Date.now();
        const cached = clientCache.get(cacheKey);

        if (cached && now - cached.timestamp < CLIENT_CACHE_TTL) {
          console.log(
            `[Events] Client cache hit (age: ${Math.floor(
              (now - cached.timestamp) / 1000 / 60
            )}min)`
          );
          setEvents(cached.data);
          setError(null);
          setLoading(false);
          return;
        }

        // Fetch from server
        const res = await fetch(`/api/events?symbols=${symbols.join(",")}`);

        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await res.json();

        // Update client cache
        clientCache.set(cacheKey, { data, timestamp: now });

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
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Upcoming Events
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading events...</div>
        </div>
      </Card>
    );
  }

  if (error || !events) {
    return (
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Upcoming Events
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {error || "No events found"}
          </p>
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
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Upcoming Events
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Upcoming Events
      </h3>

      <div className="space-y-3">
        {allEvents.map((event, idx) => {
          const Icon = getEventIcon(event.type, event.title);
          const color = getEventColor(event.type, event.title);

          return (
            <div
              key={`${event.date}-${idx}`}
              className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/80 bg-muted/60"
            >
              <div className={`shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-foreground text-sm">
                        {event.title}
                      </div>
                    </div>
                    {event.description && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {event.description}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
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
