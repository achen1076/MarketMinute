// app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSnapshotsForSymbols } from "@/lib/marketData";
import { buildSummary } from "@/lib/summary";
import DashboardClient from "./DashboardClient";
import Card from "@/components/atoms/card";
import { TickerListClient } from "@/components/molecules/TickerListClient";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      watchlists: {
        include: {
          items: true,
        },
        orderBy: [
          { isFavorite: "desc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  // Auto-set first watchlist as active if no active watchlist is set
  let activeWatchlistId = user?.activeWatchlistId;
  if (!activeWatchlistId && user?.watchlists.length) {
    activeWatchlistId = user.watchlists[0].id;
    // Update user's active watchlist
    await prisma.user.update({
      where: { email: session.user.email },
      data: { activeWatchlistId: user.watchlists[0].id },
    });
  }

  const activeWatchlist = user?.watchlists.find(
    (w: { id: string }) => w.id === activeWatchlistId
  );

  // Phase 1: Get snapshots for active watchlist
  const symbols = activeWatchlist?.items.map((i: { symbol: string }) => i.symbol) ?? [];
  const snapshots = symbols.length > 0 ? await getSnapshotsForSymbols(symbols) : [];

  // Phase 2: Build summary
  const summary = activeWatchlist
    ? buildSummary(activeWatchlist.name, snapshots)
    : null;

  return (
    <div className="space-y-6">
      <DashboardClient
        watchlists={user?.watchlists ?? []}
        activeWatchlist={activeWatchlist ?? null}
      />

      {/* Phase 2: MarketMinute Summary Card */}
      {summary && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-100">
            {summary.headline}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {summary.body}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-700 pt-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-slate-400">Total Symbols</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">
                {summary.stats.totalSymbols}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Green</div>
              <div className="mt-1 text-lg font-semibold text-emerald-400">
                {summary.stats.upCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Red</div>
              <div className="mt-1 text-lg font-semibold text-rose-400">
                {summary.stats.downCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Best Performer</div>
              <div className="mt-1 text-sm font-semibold text-emerald-400">
                {summary.stats.best
                  ? `${summary.stats.best.symbol} (+${summary.stats.best.changePct.toFixed(2)}%)`
                  : "N/A"}
              </div>
            </div>
          </div>
        </Card>
      )}

      {!activeWatchlist && user?.watchlists && user.watchlists.length > 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-400">
            Select a watchlist above to see your MarketMinute.
          </p>
        </Card>
      )}

      {user?.watchlists.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-400 mb-3">
            You don&apos;t have any watchlists yet.
          </p>
          <Link
            href="/watchlist"
            className="text-emerald-500 hover:underline"
          >
            Create your first watchlist
          </Link>
        </Card>
      )}

      {/* Phase 3: Ticker List with Explain */}
      {snapshots.length > 0 && <TickerListClient snapshots={snapshots} />}
    </div>
  );
}
