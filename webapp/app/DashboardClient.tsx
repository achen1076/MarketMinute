"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import Button from "@/components/atoms/button";
import Card from "@/components/atoms/card";

type WatchlistItem = {
  id: string;
  symbol: string;
  notes?: string | null;
};

type Watchlist = {
  id: string;
  name: string;
  items: WatchlistItem[];
  isFavorite: boolean;
};

type Props = {
  watchlists: Watchlist[];
  activeWatchlist: Watchlist | null;
};

export default function DashboardClient({
  watchlists,
  activeWatchlist: initialActive,
}: Props) {
  const [activeWatchlist, setActiveWatchlist] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const handleSetActive = async (watchlistId: string | null) => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/active-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchlistId }),
      });

      if (!res.ok) {
        console.error("Failed to set active watchlist");
        return;
      }

      const newActive = watchlistId
        ? watchlists.find((w) => w.id === watchlistId) ?? null
        : null;
      setActiveWatchlist(newActive);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your Market Minute
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track your favorite stocks and stay updated on market movements.
          </p>
        </div>
        <Link href="/watchlist">
          <Button size="lg" className="rounded-xl hover:cursor-pointer">
            Manage Watchlists
          </Button>
        </Link>
      </header>

      {/* Active Watchlist Selector */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Active Watchlist
        </h2>
        {watchlists.length === 0 ? (
          <p className="text-sm text-slate-400">
            No watchlists yet.{" "}
            <Link
              href="/watchlist"
              className="text-emerald-500 hover:underline hover:cursor-pointer"
            >
              Create one
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {watchlists.map((w) => (
              <button
                key={w.id}
                onClick={() => handleSetActive(w.id)}
                disabled={loading || activeWatchlist?.id === w.id}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-default ${
                  activeWatchlist?.id === w.id
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-500/50"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 hover:cursor-pointer"
                }`}
              >
                <span className="flex items-center gap-2">
                  {w.isFavorite && (
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  )}
                  {activeWatchlist?.id === w.id && (
                    <span className="text-xs">✓</span>
                  )}
                  {w.name} ({w.items.length})
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Active Watchlist Stats */}
      {activeWatchlist && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm text-slate-400">Watchlist</div>
            <div className="mt-1 text-2xl font-semibold text-slate-100">
              {activeWatchlist.name}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {activeWatchlist.items.length} symbol
              {activeWatchlist.items.length === 1 ? "" : "s"}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-slate-400">Symbols Tracked</div>
            <div className="mt-1 text-2xl font-semibold text-slate-100">
              {activeWatchlist.items.length}
            </div>
            <div className="mt-1 text-xs text-slate-500">Real-time</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-slate-400">Total Watchlists</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-500">
              {watchlists.length}
            </div>
            <div className="mt-1 text-xs text-slate-500">Created</div>
          </Card>
        </div>
      )}

      {/* Watchlist Symbols */}
      {activeWatchlist && activeWatchlist.items.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Tracked Symbols
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeWatchlist.items.map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-100"
              >
                {item.symbol}
              </span>
            ))}
          </div>
        </Card>
      )}

      {!activeWatchlist && watchlists.length > 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-400">
            Select a watchlist above to see your market minute.
          </p>
        </Card>
      )}
    </div>
  );
}
