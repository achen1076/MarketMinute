// app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSnapshotsForSymbols } from "@/lib/marketData";
import DashboardClient from "./DashboardClient";
import Card from "@/components/atoms/card";
import { TickerListClient } from "@/components/molecules/TickerListClient";
import { MarketMinuteSummary } from "@/components/organisms/MarketMinuteSummary";
import { AdminSettings } from "@/components/organisms/AdminSettings";
import { EventsTimeline } from "@/components/organisms/EventsTimeline";
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
        orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  let activeWatchlistId = user?.activeWatchlistId;
  if (!activeWatchlistId && user?.watchlists.length) {
    activeWatchlistId = user.watchlists[0].id;
    await prisma.user.update({
      where: { email: session.user.email },
      data: { activeWatchlistId: user.watchlists[0].id },
    });
  }

  const activeWatchlist = user?.watchlists.find(
    (w: { id: string }) => w.id === activeWatchlistId
  );

  const symbols =
    activeWatchlist?.items.map((i: { symbol: string }) => i.symbol) ?? [];
  const snapshots =
    symbols.length > 0 ? await getSnapshotsForSymbols(symbols) : [];

  return (
    <>
      <div className="space-y-6">
        {/* Watchlist Selector */}
        <DashboardClient
          watchlists={user?.watchlists ?? []}
          activeWatchlist={activeWatchlist ?? null}
        />

        {/* Market Summary + Ticker List */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-6">
            {activeWatchlistId && (
              <MarketMinuteSummary watchlistId={activeWatchlistId} />
            )}

            {/* Upcoming Events */}
            {snapshots.length > 0 && (
              <EventsTimeline symbols={symbols} />
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
          </div>

          {/* Ticker List */}
          {snapshots.length > 0 && (
            <div className="w-full xl:w-96 shrink-0">
              <div className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-4rem)]">
                <TickerListClient snapshots={snapshots} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Settings */}
      <AdminSettings />
    </>
  );
}
