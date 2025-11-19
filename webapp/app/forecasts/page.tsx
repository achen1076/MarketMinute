import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarketForecastsClient } from "@/components/organisms/MarketForecastsClient";

export const metadata = {
  title: "MarketMinute - Market Forecasts",
  description:
    "Distributional forecasts showing expected price ranges and probabilities",
};

export default async function ForecastsPage() {
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
  }

  const activeWatchlist = user?.watchlists.find(
    (w) => w.id === activeWatchlistId
  );
  const symbols = activeWatchlist?.items.map((i) => i.symbol) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-teal-500/30 bg-teal-500/5 p-6">
        <div className="flex items-start gap-3">
          <div className="text-teal-500 text-2xl">📊</div>
          <div>
            <h2 className="text-lg font-bold text-teal-500 mb-2">
              Market Forecasts – Probabilistic Analysis
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>Educational Tool:</strong> These forecasts show expected
              price ranges and probability distributions based on historical
              volatility and model predictions. Use as one of many inputs for
              research and learning, not as trading advice.
            </p>
          </div>
        </div>
      </div>

      <MarketForecastsClient
        symbols={symbols}
        watchlistName={activeWatchlist?.name}
      />
    </div>
  );
}
