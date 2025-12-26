import { auth } from "@/auth";
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
import { MovementAlertsBar } from "@/components/organisms/MovementAlertsBar";
import SentinelExplainToday from "@/components/organisms/SentinelExplainToday";
import Link from "next/link";
import { Metadata } from "next";
import { TrendingUp, Bell, Zap, BarChart3, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "MarketMinute - Your AI-Powered Market Intelligence",
  description:
    "Get real-time market insights, smart alerts, and AI-powered analysis for your portfolio.",
};

export const revalidate = 0;

function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm mb-8">
            <Zap className="w-4 h-4" />
            AI-Powered Market Intelligence
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Markets,{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Stay ahead with real-time insights, smart alerts, and AI-powered
            analysis. Track your watchlists and never miss a market-moving
            event.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Everything you need to stay informed
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Real-Time Tracking
              </h3>
              <p className="text-slate-400">
                Monitor your watchlists with live price updates and market data
                throughout the trading day.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Smart Alerts
              </h3>
              <p className="text-slate-400">
                Get intelligent notifications about earnings, dividends, and
                significant price movements.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                AI Insights
              </h3>
              <p className="text-slate-400">
                Leverage AI-powered market summaries and analysis to understand
                what&apos;s driving your portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

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
            {/* Movement Alerts */}
            {snapshots.length > 0 && <MovementAlertsBar symbols={symbols} />}

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
