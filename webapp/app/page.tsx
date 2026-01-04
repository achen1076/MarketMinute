import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCachedSnapshots } from "@/lib/tickerCache";
import DashboardClient from "./DashboardClient";
import Card from "@/components/atoms/Card";
import { Stack } from "@/components/atoms/Stack";
import { Box } from "@/components/atoms/Box";
import { TickerListClient } from "@/components/molecules/TickerListClient";
import { MarketMinuteSummary } from "@/components/organisms/MarketMinuteSummary";
import { EventsTimeline } from "@/components/organisms/EventsTimeline";
import { MovementAlertsBar } from "@/components/organisms/MovementAlertsBar";
import SentinelExplainToday from "@/components/organisms/SentinelExplainToday";
import LandingPage from "@/components/pages/LandingPage";
import QuickStartWatchlist from "@/components/organisms/QuickStartWatchlist";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MarketMinute - Your AI-Powered Market Intelligence",
  description:
    "Get real-time market insights, smart alerts, and AI-powered analysis for your portfolio. Track watchlists, understand why stocks move, and never miss important events.",
};

export const revalidate = 0;

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    return <LandingPage />;
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

        {/* Quick Start for new users - full width */}
        {(user?.watchlists?.length ?? 0) === 0 && <QuickStartWatchlist />}

        {/* Market Summary + Ticker List - only show when user has watchlists */}
        {(user?.watchlists?.length ?? 0) > 0 && (
          <Box display="flex" direction="col" gap="xl" className="xl:flex-row">
            {/* Right Sidebar */}
            <Stack spacing="xl" className="xl:w-1/3">
              {snapshots.length > 0 && (
                <TickerListClient
                  snapshots={snapshots}
                  watchlistId={activeWatchlistId ?? null}
                />
              )}
            </Stack>
            {/* Main Content Area */}
            <Stack spacing="xl" className="flex-1 min-w-0">
              {activeWatchlistId && (
                <MarketMinuteSummary watchlistId={activeWatchlistId} />
              )}
              {/* Sentinel Explain Today */}
              {snapshots.length > 0 && <SentinelExplainToday />}
              {/* Upcoming Events */}
              {snapshots.length > 0 && <EventsTimeline symbols={symbols} />}
              {/* Movement Alerts */}
              {snapshots.length > 0 && <MovementAlertsBar symbols={symbols} />}
            </Stack>
          </Box>
        )}
      </Stack>

      {/* Admin Settings */}
      {/* {session?.user?.email === "achen1076@gmail.com" && <AdminSettings />} */}
    </>
  );
}
