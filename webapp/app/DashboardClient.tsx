"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import Card from "@/components/atoms/Card";

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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Your Market Minute
        </h1>
        <p className="mt-1 text-sm text-foreground/50">
          Track your favorite stocks and stay updated on market movements.
        </p>
      </header>

      {/* Active Watchlist Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground/50">
            Your Watchlists
          </h2>
          <Link
            href="/watchlist"
            className="text-xs text-emerald-500 hover:text-emerald-400 hover:underline transition-colors"
          >
            Manage
          </Link>
        </div>
        {watchlists.length === 0 ? (
          <p className="text-sm text-foreground/50">
            No watchlists yet.{" "}
            <Link
              href="/watchlist"
              className="text-emerald-500 hover:underline hover:cursor-pointer"
            >
              Create one
            </Link>
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
                    : "bg-background text-foreground/50 hover:bg-background/80 disabled:opacity-50 hover:cursor-pointer"
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
