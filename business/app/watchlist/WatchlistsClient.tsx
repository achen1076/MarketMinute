"use client";

import { useState } from "react";
import { Star, GripVertical } from "lucide-react";
import { TickerSearch } from "@shared/components/molecules/TickerSearch";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  addSymbolsToWatchlist,
  Watchlist,
  WatchlistItem,
} from "@shared/lib/watchlist";

type Props = {
  initialWatchlists: Watchlist[];
  userName: string;
};

type SortableItemProps = {
  item: WatchlistItem;
  onRemove: () => void;
  disabled: boolean;
};

function SortableItem({ item, onRemove, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <span
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-foreground pr-2 ${
        isDragging ? "z-50 shadow-lg" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        disabled={disabled}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      {item.symbol}
      <button
        onClick={onRemove}
        disabled={disabled}
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
    </span>
  );
}

export function WatchlistsClient({ initialWatchlists, userName }: Props) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(initialWatchlists);
  const [name, setName] = useState("");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingWatchlistId, setEditingWatchlistId] = useState<string | null>(
    null
  );
  const [editSymbols, setEditSymbols] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [draggedItems, setDraggedItems] = useState<
    Record<string, WatchlistItem[]>
  >({});
  const [pendingReorder, setPendingReorder] = useState<Record<string, boolean>>(
    {}
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreate = async () => {
    if (!name.trim() || selectedSymbols.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, symbols: selectedSymbols }),
      });

      if (!res.ok) {
        setError("Failed to create watchlist");
        return;
      }

      const created = (await res.json()) as Watchlist;
      setWatchlists((prev) => [...prev, created]);
      setName("");
      setSelectedSymbols([]);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (watchlistId: string) => {
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

  const handleDragEnd = (event: DragEndEvent, watchlistId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentItems =
      draggedItems[watchlistId] ||
      watchlists.find((w) => w.id === watchlistId)?.items ||
      [];
    const oldIndex = currentItems.findIndex((item) => item.id === active.id);
    const newIndex = currentItems.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(currentItems, oldIndex, newIndex);
    setDraggedItems((prev) => ({ ...prev, [watchlistId]: newItems }));
    setPendingReorder((prev) => ({ ...prev, [watchlistId]: true }));
  };

  const handleSaveAllChanges = async (watchlistId: string) => {
    const watchlist = watchlists.find((w) => w.id === watchlistId);
    if (!watchlist) return;

    setLoading(true);
    try {
      if (editName.trim() && editName !== watchlist.name) {
        const res = await fetch("/api/watchlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchlistId, name: editName }),
        });

        if (res.ok) {
          const updated = (await res.json()) as Watchlist;
          setWatchlists((prev) =>
            prev.map((w) => (w.id === watchlistId ? updated : w))
          );
        }
      }

      if (pendingReorder[watchlistId] && draggedItems[watchlistId]) {
        const newItems = draggedItems[watchlistId];
        const itemOrders = newItems.map((item, index) => ({
          id: item.id,
          order: index,
        }));

        const res = await fetch("/api/watchlist/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchlistId, itemOrders }),
        });

        if (res.ok) {
          const updated = (await res.json()) as Watchlist;
          setWatchlists((prev) =>
            prev.map((w) => (w.id === watchlistId ? updated : w))
          );
        }
      }

      if (editSymbols.length > 0) {
        const result = await addSymbolsToWatchlist(watchlistId, editSymbols);

        if (!result.success) {
          setEditError(result.error || "Failed to add symbols");
          return;
        }

        if (result.watchlist) {
          setWatchlists((prev) =>
            prev.map((w) =>
              w.id === watchlistId
                ? { ...result.watchlist!, isFavorite: w.isFavorite }
                : w
            )
          );
        }
      }

      setEditingWatchlistId(null);
      setEditSymbols([]);
      setEditName("");
      setDraggedItems((prev) => {
        const updated = { ...prev };
        delete updated[watchlistId];
        return updated;
      });
      setPendingReorder((prev) => {
        const updated = { ...prev };
        delete updated[watchlistId];
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const getWatchlistItems = (watchlistId: string) => {
    return (
      draggedItems[watchlistId] ||
      watchlists.find((w) => w.id === watchlistId)?.items ||
      []
    );
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
        body: JSON.stringify({ watchlistId, isFavorite: !currentFavorite }),
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
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return 0;
          })
      );
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Watchlists</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved for{" "}
            <span className="font-medium text-foreground">{userName}</span>.
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Create a new watchlist
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Watchlist Name
            </label>
            <input
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-emerald-500"
              placeholder="e.g. Tech Stocks, Growth Portfolio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Add Stocks
            </label>
            <TickerSearch
              selectedSymbols={selectedSymbols}
              onSymbolsChange={setSelectedSymbols}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim() || selectedSymbols.length === 0}
              className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Watchlist"}
            </button>
          </div>
        </div>
      </div>

      {watchlists.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No watchlists yet. Create your first one above.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {watchlists.map((w) => {
            const isEditing = editingWatchlistId === w.id;

            return (
              <div
                key={w.id}
                className="rounded-xl border border-border bg-card p-4 text-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFavorite(w.id, w.isFavorite)}
                      disabled={loading}
                      className="group transition-colors hover:cursor-pointer disabled:opacity-50"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          w.isFavorite
                            ? "fill-emerald-400 text-emerald-400"
                            : "text-muted-foreground group-hover:text-emerald-400"
                        }`}
                      />
                    </button>
                    <h3 className="text-base font-semibold text-foreground">
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
                        className="rounded-md border border-emerald-400 px-2 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-400/10 hover:cursor-pointer disabled:opacity-50"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={loading}
                      className="rounded-md border border-red-400 px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-50 hover:cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mb-1 text-xs text-muted-foreground">
                  {w.items.length} symbol{w.items.length === 1 ? "" : "s"}
                </div>
                {w.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {isEditing ? "Add symbols below" : "No symbols yet."}
                  </p>
                ) : isEditing ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, w.id)}
                  >
                    <SortableContext
                      items={getWatchlistItems(w.id).map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-wrap gap-2">
                        {getWatchlistItems(w.id).map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onRemove={() => handleRemoveItem(w.id, item.id)}
                            disabled={loading}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {w.items.slice(0, 25).map((item) => (
                      <span
                        key={item.id}
                        className="group flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-foreground"
                      >
                        {item.symbol}
                      </span>
                    ))}
                    {w.items.length > 25 && (
                      <span className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                        +{w.items.length - 25} more
                      </span>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Watchlist Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted-foreground">
                        Add Stocks
                      </label>
                      <TickerSearch
                        selectedSymbols={editSymbols}
                        onSymbolsChange={setEditSymbols}
                        disabled={loading}
                      />
                      {editError && (
                        <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/50 p-2 text-xs text-red-400">
                          {editError}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingWatchlistId(null);
                          setEditSymbols([]);
                          setEditName("");
                          setEditError(null);
                          setDraggedItems((prev) => {
                            const updated = { ...prev };
                            delete updated[w.id];
                            return updated;
                          });
                          setPendingReorder((prev) => {
                            const updated = { ...prev };
                            delete updated[w.id];
                            return updated;
                          });
                        }}
                        disabled={loading}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 hover:cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleSaveAllChanges(w.id)}
                        disabled={
                          loading ||
                          (editSymbols.length === 0 &&
                            !pendingReorder[w.id] &&
                            (editName === w.name || !editName.trim()))
                        }
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
