import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/atoms/Card";
import { SinceLastVisit } from "@/components/organisms/SinceLastVisit";
import { WatchlistTimeline } from "@/components/organisms/WatchlistTimeline";
import WatchlistSelector from "@/components/organisms/WatchlistSelector";

export const metadata = {
  title: "MarketMinute - History",
  description:
    "Track changes since your last visit and view your watchlist timeline.",
};

export default async function HistoryPage() {
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

  const activeWatchlist = user?.watchlists.find(
    (w) => w.id === user?.activeWatchlistId
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track changes since your last visit and view your watchlist timeline.
        </p>
      </header>

      <WatchlistSelector
        watchlists={user?.watchlists ?? []}
        activeWatchlist={activeWatchlist ?? null}
        showManageButton
      />

      {!activeWatchlist && (
        <Card className="p-6 text-center">
          <p className="text-slate-400">
            Select an active watchlist to view history.
          </p>
        </Card>
      )}

      {activeWatchlist && (
        <>
          {/* Since Last Visit */}
          <SinceLastVisit watchlistId={activeWatchlist.id} userId={user!.id} />

          {/* 7-Day Timeline */}
          <WatchlistTimeline watchlistId={activeWatchlist.id} />
        </>
      )}
    </div>
  );
}
