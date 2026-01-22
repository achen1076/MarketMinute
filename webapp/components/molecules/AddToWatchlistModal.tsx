"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, ChevronDown } from "lucide-react";
import Card from "@/components/atoms/Card";
import {
  fetchWatchlists as fetchWatchlistsApi,
  addSymbolsToWatchlist,
  Watchlist,
} from "@shared/lib/watchlist";

type Props = {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
};

export function AddToWatchlistModal({ symbol, isOpen, onClose }: Props) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWatchlists();
      setSuccess(false);
      setError(null);
      setLimitReached(false);
    }
  }, [isOpen]);

  const loadWatchlists = async () => {
    setLoading(true);
    const result = await fetchWatchlistsApi();

    if (result.success) {
      setWatchlists(result.watchlists);
      if (result.watchlists.length > 0) {
        setSelectedWatchlistId(result.watchlists[0].id);
      }
    } else {
      setError(result.error || "Failed to load watchlists");
    }

    setLoading(false);
  };

  const handleAdd = async () => {
    if (!selectedWatchlistId) return;

    setAdding(true);
    setError(null);
    setLimitReached(false);

    const result = await addSymbolsToWatchlist(selectedWatchlistId, [symbol]);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError(result.error || "Failed to add to watchlist");
      setLimitReached(result.limitReached || false);
    }

    setAdding(false);
  };

  // Check if symbol already exists in selected watchlist
  const selectedWatchlist = watchlists.find(
    (w) => w.id === selectedWatchlistId
  );
  const alreadyInWatchlist = selectedWatchlist?.items.some(
    (item) => item.symbol === symbol
  );
  const currentCount = selectedWatchlist?.items.length || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md mx-4 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Add to Watchlist
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : error && !watchlists.length ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        ) : watchlists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any watchlists yet.
            </p>
            <a
              href="/watchlist"
              className="inline-block px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors"
            >
              Create Watchlist
            </a>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-foreground font-medium">
              {symbol} added to watchlist!
            </p>
          </div>
        ) : (
          <>
            {/* Symbol being added */}
            <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center gap-3">
              <div>
                <p className="font-semibold text-foreground">{symbol}</p>
                <p className="text-sm text-muted-foreground">
                  Add to watchlist
                </p>
              </div>
            </div>

            {/* Watchlist dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Select Watchlist
              </label>
              <div className="relative">
                <select
                  value={selectedWatchlistId}
                  onChange={(e) => setSelectedWatchlistId(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  {watchlists.map((watchlist) => (
                    <option key={watchlist.id} value={watchlist.id}>
                      {watchlist.name} ({watchlist.items.length} stocks)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
              {/* Show current count info */}
              <p className="mt-2 text-xs text-muted-foreground">
                {currentCount} stock{currentCount !== 1 ? "s" : ""} in this
                watchlist
              </p>
            </div>

            {/* Already in watchlist warning */}
            {alreadyInWatchlist && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                {symbol} is already in this watchlist
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                {error}
                {limitReached && (
                  <a
                    href="/settings"
                    className="ml-1 underline hover:text-rose-300"
                  >
                    Upgrade
                  </a>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg text-foreground transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding || alreadyInWatchlist}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
