"use client";

import { useEffect, useState } from "react";
import Card from "@/components/atoms/Card";
import { EmptyState } from "@/components/atoms/EmptyState";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";

type DailySummary = {
  id: string;
  date: string;
  avgChangePct: number;
  bestPerformer?: string | null;
  bestChangePct?: number | null;
  worstPerformer?: string | null;
  worstChangePct?: number | null;
  summaryText: string;
  fullSummary?: string | null;
};

type Props = {
  watchlistId: string;
};

function formatDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function WatchlistTimeline({ watchlistId }: Props) {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DailySummary | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/daily-summary?watchlistId=${watchlistId}&days=7`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch summaries");
        }

        const data = await response.json();
        setSummaries(data.summaries || []);
      } catch (error) {
        console.error("Error fetching daily summaries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [watchlistId]);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">
          7-Day Timeline
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-900/60"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (summaries.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="7-Day Timeline"
        description="Daily summaries will appear here after you've used MarketMinute for a few days."
      />
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Calendar size={16} />
        7-Day Timeline
      </h3>

      <div className="space-y-2">
        {summaries.map((summary) => {
          const isSelected = selectedDay?.id === summary.id;
          const Icon =
            summary.avgChangePct > 0
              ? TrendingUp
              : summary.avgChangePct < 0
              ? TrendingDown
              : Minus;
          const color =
            summary.avgChangePct > 0
              ? "text-emerald-400"
              : summary.avgChangePct < 0
              ? "text-rose-400"
              : "text-slate-400";

          return (
            <div key={summary.id}>
              <button
                onClick={() => setSelectedDay(isSelected ? null : summary)}
                className={`w-full rounded-lg p-4 text-left transition-all ${
                  isSelected
                    ? "bg-slate-800/80 ring-1 ring-emerald-500/30"
                    : "bg-slate-900/60 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={color} />
                    <div>
                      <div className="text-xs text-slate-500">
                        {formatDayOfWeek(summary.date)}
                      </div>
                      <div className="text-sm font-medium text-slate-200">
                        {formatDate(summary.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${color}`}>
                        {summary.avgChangePct >= 0 ? "+" : ""}
                        {summary.avgChangePct.toFixed(2)}%
                      </div>
                      {summary.bestPerformer && (
                        <div className="text-xs text-slate-500">
                          {summary.bestPerformer} led
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-sm text-slate-400">
                  {summary.summaryText}
                </div>
              </button>

              {isSelected && summary.fullSummary && (
                <div className="mt-2 rounded-lg bg-slate-800/50 p-4">
                  <div className="text-sm text-slate-300">
                    <h4 className="mb-2 font-semibold text-slate-200">
                      Full Summary
                    </h4>
                    {JSON.parse(summary.fullSummary).body || (
                      <p className="text-slate-400">
                        No detailed summary available
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
