"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import TickerSearch from "@/components/molecules/TickerSearch";

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
  initialWatchlists: Watchlist[];
  userName: string;
};

export default function WatchlistsClient({
  initialWatchlists,
  userName,
}: Props) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(initialWatchlists);
  const [name, setName] = useState("");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingWatchlistId, setEditingWatchlistId] = useState<string | null>(
    null
  );
  const [editSymbols, setEditSymbols] = useState<string[]>([]);
  const [editName, setEditName] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || selectedSymbols.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, symbols: selectedSymbols }),
      });

      if (!res.ok) {
        console.error("Failed to create watchlist", await res.text());
        return;
      }

      const created = (await res.json()) as Watchlist;
      setWatchlists((prev) => [...prev, created]);
      setName("");
      setSelectedSymbols([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (watchlistId: string) => {
    if (!confirm("Are you sure you want to delete this watchlist?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/watchlist?id=${watchlistId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to delete watchlist");
        return;
      }

      setWatchlists((prev) => prev.filter((w) => w.id !== watchlistId));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (
    watchlistId: string,
    currentFavorite: boolean
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchlistId,
          isFavorite: !currentFavorite,
        }),
      });

      if (!res.ok) {
        console.error("Failed to toggle favorite");
        return;
      }

      const updated = (await res.json()) as Watchlist;
      setWatchlists((prev) =>
        prev
          .map((w) => (w.id === watchlistId ? updated : w))
          .sort((a, b) => {
            // Sort favorites first, then by creation date
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return 0;
          })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddSymbols = async (watchlistId: string) => {
    if (editSymbols.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/watchlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchlistId,
          symbols: editSymbols,
        }),
      });

      if (!res.ok) {
        console.error("Failed to add symbols");
        return;
      }

      const updated = (await res.json()) as Watchlist;
      setWatchlists((prev) =>
        prev.map((w) => (w.id === watchlistId ? updated : w))
      );
      setEditSymbols([]);
      setEditingWatchlistId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (watchlistId: string, itemId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/watchlist/items?id=${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to remove item");
        return;
      }

      setWatchlists((prev) =>
        prev.map((w) =>
          w.id === watchlistId
            ? { ...w, items: w.items.filter((item) => item.id !== itemId) }
            : w
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (watchlistId: string) => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchlistId,
          name: editName,
        }),
      });

      if (!res.ok) {
        console.error("Failed to update name");
        return;
      }

      const updated = (await res.json()) as Watchlist;
      setWatchlists((prev) =>
        prev.map((w) => (w.id === watchlistId ? updated : w))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Watchlists</h1>
          <p className="mt-1 text-sm text-slate-400">
            Saved for{" "}
            <span className="font-medium text-slate-200">{userName}</span>.
          </p>
        </div>
      </header>

      {/* Create watchlist form */}
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Create a new watchlist
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300">
              Watchlist Name
            </label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500"
              placeholder="e.g. Tech Stocks, Growth Portfolio, Dividend Picks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300">
              Add Stocks
            </label>
            <TickerSearch
              selectedSymbols={selectedSymbols}
              onSymbolsChange={setSelectedSymbols}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={loading || !name.trim() || selectedSymbols.length === 0}
              className="px-6 hover:cursor-pointer"
            >
              {loading ? "Creating..." : "Create Watchlist"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Existing watchlists */}
      {watchlists.length === 0 ? (
        <p className="text-sm text-slate-400">
          No watchlists yet. Create your first one above.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {watchlists.map((w) => {
            const isEditing = editingWatchlistId === w.id;

            return (
              <Card key={w.id} className="p-4 text-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFavorite(w.id, w.isFavorite)}
                      disabled={loading}
                      className="group transition-colors hover:cursor-pointer disabled:opacity-50"
                      title={
                        w.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          w.isFavorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-600 group-hover:text-amber-400"
                        }`}
                      />
                    </button>
                    <h3 className="text-base font-semibold text-slate-100">
                      {w.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingWatchlistId(w.id);
                          setEditSymbols([]);
                          setEditName(w.name);
                        }}
                        disabled={loading}
                        className="rounded-md bg-emerald-900/30 px-2 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-900/50 hover:text-emerald-300 hover:cursor-pointer disabled:opacity-50"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={loading}
                      className="rounded-md bg-red-900/30 px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300 disabled:opacity-50 hover:cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Symbols */}
                <div className="mb-1 text-xs text-slate-500">
                  {w.items.length} symbol{w.items.length === 1 ? "" : "s"}
                </div>
                {w.items.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {isEditing ? "Add symbols below" : "No symbols yet."}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {w.items.map((item) => (
                      <span
                        key={item.id}
                        className={`group flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-100 ${
                          isEditing ? "pr-2" : ""
                        }`}
                      >
                        {item.symbol}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveItem(w.id, item.id)}
                            disabled={loading}
                            className="rounded-full p-0.5 transition-colors hover:cursor-pointer hover:bg-red-900/50 disabled:opacity-50"
                            title="Remove symbol"
                          >
                            <svg
                              className="h-3 w-3 text-red-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Edit Mode */}
                {isEditing && (
                  <div className="mt-4 space-y-3 border-t border-slate-700 pt-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-300">
                        Watchlist Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={loading}
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500 disabled:opacity-50"
                          placeholder="Watchlist name"
                        />
                        <button
                          onClick={() => handleUpdateName(w.id)}
                          disabled={
                            loading || !editName.trim() || editName === w.name
                          }
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-300">
                        Add Stocks
                      </label>
                      <TickerSearch
                        selectedSymbols={editSymbols}
                        onSymbolsChange={setEditSymbols}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingWatchlistId(null);
                          setEditSymbols([]);
                          setEditName("");
                        }}
                        disabled={loading}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 disabled:opacity-50 hover:cursor-pointer"
                      >
                        Cancel
                      </button>
                      <Button
                        onClick={() => handleAddSymbols(w.id)}
                        disabled={loading || editSymbols.length === 0}
                        size="sm"
                        className="px-4 text-xs hover:cursor-pointer"
                      >
                        {loading
                          ? "Adding..."
                          : `Add ${editSymbols.length} symbol${
                              editSymbols.length === 1 ? "" : "s"
                            }`}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
