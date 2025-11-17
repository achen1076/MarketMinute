"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

      // Refresh the server component to fetch new data
      router.refresh();
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
          <Button size="md" className="rounded-xl hover:cursor-pointer">
            Manage Watchlists
          </Button>
        </Link>
      </header>

      {/* Active Watchlist Selector */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Your Watchlists
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
    </div>
  );
}
