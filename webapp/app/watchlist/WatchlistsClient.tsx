"use client";

import { useState } from "react";
import { Star, GripVertical } from "lucide-react";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Dialog from "@/components/atoms/Dialog";
import TickerSearch from "@/components/molecules/TickerSearch";
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
import { QuantLabAvailableTickers } from "@/components/molecules/QuantLabAvailableTickers";
import {
  addSymbolsToWatchlist,
  Watchlist,
  WatchlistItem,
} from "@shared/lib/watchlist";

type Props = {
  initialWatchlists: Watchlist[];
  userName: string;
  maxSymbols?: number;
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

export default function WatchlistsClient({
  initialWatchlists,
  userName,
  maxSymbols,
}: Props) {
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [watchlistToDelete, setWatchlistToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
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
        const errorData = await res.json();
        if (res.status === 403) {
          setError(
            errorData.error ||
              "Watchlist limit reached. Upgrade to create more."
          );
        } else {
          setError("Failed to create watchlist");
        }
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

  const handleDelete = async () => {
    if (!watchlistToDelete) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/watchlist?id=${watchlistToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to delete watchlist");
        return;
      }

      setWatchlists((prev) =>
        prev.filter((w) => w.id !== watchlistToDelete.id)
      );
      setDeleteDialogOpen(false);
      setWatchlistToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (watchlistId: string, watchlistName: string) => {
    setWatchlistToDelete({ id: watchlistId, name: watchlistName });
    setDeleteDialogOpen(true);
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

  const handleSaveOrder = async (watchlistId: string) => {
    const newItems = draggedItems[watchlistId];
    if (!newItems) return;

    setLoading(true);
    try {
      const itemOrders = newItems.map((item, index) => ({
        id: item.id,
        order: index,
      }));

      const res = await fetch("/api/watchlist/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchlistId, itemOrders }),
      });

      if (!res.ok) {
        console.error("Failed to update order");
        return;
      }

      const updated = (await res.json()) as Watchlist;
      setWatchlists((prev) =>
        prev.map((w) => (w.id === watchlistId ? updated : w))
      );
      // Clear dragged state and pending flag after successful update
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

  const handleSaveAllChanges = async (watchlistId: string) => {
    const watchlist = watchlists.find((w) => w.id === watchlistId);
    if (!watchlist) return;

    setLoading(true);
    try {
      // 1. Update name if changed
      if (editName.trim() && editName !== watchlist.name) {
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
      }

      // 2. Save order if changed
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

        if (!res.ok) {
          console.error("Failed to update order");
          return;
        }

        const updated = (await res.json()) as Watchlist;
        setWatchlists((prev) =>
          prev.map((w) => (w.id === watchlistId ? updated : w))
        );
      }

      // 3. Add new symbols
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
    setEditError(null);

    const result = await addSymbolsToWatchlist(watchlistId, editSymbols);

    if (result.success && result.watchlist) {
      setWatchlists((prev) =>
        prev.map((w) =>
          w.id === watchlistId
            ? { ...result.watchlist!, isFavorite: w.isFavorite }
            : w
        )
      );
      setEditSymbols([]);
      setEditingWatchlistId(null);
    } else {
      setEditError(result.error || "Failed to add symbols");
    }

    setLoading(false);
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
          <p className="mt-1 text-sm text-muted-foreground">
            Saved for{" "}
            <span className="font-medium text-foreground">{userName}</span>.
          </p>
        </div>
      </header>

      {/* Create watchlist form */}
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Create a new watchlist
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-400">
            {error}{" "}
            <a href="/settings" className="underline hover:text-red-300">
              View plans
            </a>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Watchlist Name
            </label>
            <input
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              placeholder="e.g. Tech Stocks, Growth Portfolio, Dividend Picks"
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
              maxSymbols={maxSymbols}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              💡 Tip: Smaller watchlists (10-20 stocks) produce more accurate
              and focused results.
            </p>
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
        <p className="text-sm text-muted-foreground">
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
                            : "text-muted-foreground group-hover:text-amber-400"
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
                        className="rounded-md border border-emerald-400 px-2 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-400/10 hover:text-emerald-300 hover:cursor-pointer disabled:opacity-50"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteDialog(w.id, w.name)}
                      disabled={loading}
                      className="rounded-md border border-red-400 px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50 hover:cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Symbols */}
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

                {/* Edit Mode */}
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
                        className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:opacity-50"
                        placeholder="Watchlist name"
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
                        maxSymbols={
                          maxSymbols !== undefined
                            ? Math.max(0, maxSymbols - w.items.length)
                            : undefined
                        }
                      />
                      {editError && (
                        <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/50 p-2 text-xs text-red-400">
                          {editError}{" "}
                          <a
                            href="/settings"
                            className="underline hover:text-red-300"
                          >
                            Upgrade
                          </a>
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
                      <Button
                        onClick={() => handleSaveAllChanges(w.id)}
                        disabled={
                          loading ||
                          (editSymbols.length === 0 &&
                            !pendingReorder[w.id] &&
                            (editName === w.name || !editName.trim()))
                        }
                        size="sm"
                        className="px-4 text-xs hover:cursor-pointer"
                      >
                        {loading
                          ? "Saving..."
                          : `Save Changes${
                              editSymbols.length > 0
                                ? ` (${editSymbols.length} symbol${
                                    editSymbols.length === 1 ? "" : "s"
                                  })`
                                : ""
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setWatchlistToDelete(null);
        }}
        title="Delete Watchlist"
        description={`Are you sure you want to delete "${watchlistToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        variant="danger"
        loading={loading}
      />

      <QuantLabAvailableTickers />
    </div>
  );
}
