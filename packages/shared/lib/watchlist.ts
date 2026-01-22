/**
 * Shared watchlist utilities for consistent behavior across the app
 */

export type WatchlistItem = {
  id: string;
  symbol: string;
  notes?: string | null;
};

export type Watchlist = {
  id: string;
  name: string;
  items: WatchlistItem[];
  isFavorite: boolean;
};

export type AddToWatchlistResult = {
  success: boolean;
  watchlist?: Watchlist;
  error?: string;
  limitReached?: boolean;
  limit?: number | "unlimited";
};

/**
 * Add symbols to a watchlist with proper error handling and limit checks
 */
export async function addSymbolsToWatchlist(
  watchlistId: string,
  symbols: string[]
): Promise<AddToWatchlistResult> {
  try {
    const res = await fetch("/api/watchlist/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchlistId,
        symbols,
      }),
    });

    if (res.ok) {
      const watchlist = await res.json();
      return { success: true, watchlist };
    }

    const data = await res.json();

    if (res.status === 403) {
      return {
        success: false,
        error:
          data.error ||
          "Watchlist item limit reached. Upgrade for unlimited tickers.",
        limitReached: true,
        limit: data.limit,
      };
    }

    if (res.status === 401) {
      return {
        success: false,
        error: "Please sign in to add to watchlist",
      };
    }

    return {
      success: false,
      error: data.error || "Failed to add to watchlist",
    };
  } catch {
    return {
      success: false,
      error: "Failed to add to watchlist",
    };
  }
}

/**
 * Fetch user's watchlists
 */
export async function fetchWatchlists(): Promise<{
  success: boolean;
  watchlists: Watchlist[];
  error?: string;
}> {
  try {
    const res = await fetch("/api/watchlist");

    if (res.ok) {
      const watchlists = await res.json();
      return { success: true, watchlists };
    }

    if (res.status === 401) {
      return {
        success: false,
        watchlists: [],
        error: "Please sign in to view watchlists",
      };
    }

    return {
      success: false,
      watchlists: [],
      error: "Failed to load watchlists",
    };
  } catch {
    return {
      success: false,
      watchlists: [],
      error: "Failed to load watchlists",
    };
  }
}

/**
 * Get remaining slots for a watchlist based on current items and limit
 */
export function getRemainingSlots(
  currentCount: number,
  limit: number | "unlimited"
): number | "unlimited" {
  if (limit === "unlimited") return "unlimited";
  return Math.max(0, limit - currentCount);
}

/**
 * Check if a watchlist is at its limit
 */
export function isWatchlistAtLimit(
  currentCount: number,
  limit: number | "unlimited"
): boolean {
  if (limit === "unlimited") return false;
  return currentCount >= limit;
}
