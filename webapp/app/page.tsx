import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCachedSnapshots } from "@/lib/tickerCache";
import DashboardClient from "./DashboardClient";
import Card from "@/components/atoms/Card";
import { Stack } from "@/components/atoms/Stack";
import { Box } from "@/components/atoms/Box";
import { TickerListClient } from "@/components/molecules/TickerListClient";
import { MarketMinuteSummary } from "@/components/organisms/MarketMinuteSummary";
import { AdminSettings } from "@/components/organisms/AdminSettings";
import { EventsTimeline } from "@/components/organisms/EventsTimeline";
import { SmartAlertsBar } from "@/components/organisms/SmartAlertsBar";
import SentinelExplainToday from "@/components/organisms/SentinelExplainToday";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
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
  const { snapshots: rawSnapshots } =
    symbols.length > 0 ? await getCachedSnapshots(symbols) : { snapshots: [] };

  // Enrich snapshots with favorite status and item IDs from database
  const snapshots = rawSnapshots.map((snapshot) => {
    const item = activeWatchlist?.items.find(
      (i: any) => i.symbol.toUpperCase() === snapshot.symbol.toUpperCase()
    );
    return {
      ...snapshot,
      isFavorite: item?.isFavorite ?? false,
      itemId: item?.id ?? null,
    };
  });

  return (
    <>
      <Stack spacing="xl">
        {/* Watchlist Selector */}
        <DashboardClient
          watchlists={user?.watchlists ?? []}
          activeWatchlist={activeWatchlist ?? null}
        />

        {/* Market Summary + Ticker List */}
        <Box display="flex" direction="col" gap="xl" className="xl:flex-row">
          {/* Main Content Area */}
          <Stack spacing="xl" className="flex-1 min-w-0">
            {activeWatchlistId && (
              <MarketMinuteSummary watchlistId={activeWatchlistId} />
            )}
            {/* Sentinel Explain Today */}
            <SentinelExplainToday />
            {/* Upcoming Events */}
            {snapshots.length > 0 && <EventsTimeline symbols={symbols} />}
            {/* Smart Alerts */}
            {snapshots.length > 0 && <SmartAlertsBar symbols={symbols} />}

            {/* Sentinel Intelligence Panel */}

            {user?.watchlists.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-slate-400 mb-3">
                  You don&apos;t have any watchlists yet.{" "}
                  <Link
                    href="/watchlist"
                    className="text-teal-500 hover:text-cyan-400 hover:underline transition-colors"
                  >
                    Create your first watchlist
                  </Link>
                </p>
              </Card>
            )}
          </Stack>

          {/* Right Sidebar */}
          <Stack spacing="xl" className="xl:w-96">
            {snapshots.length > 0 && (
              <TickerListClient
                snapshots={snapshots}
                watchlistId={activeWatchlistId ?? null}
              />
            )}
          </Stack>
        </Box>
      </Stack>

      {/* Admin Settings */}
      {session?.user?.email === "achen1076@gmail.com" && <AdminSettings />}
    </>
  );
}
