import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QuantLabClient } from "@/components/organisms/QuantLabClient";
import WatchlistSelector from "@/components/organisms/WatchlistSelector";
import QuantLabInfo from "@/components/pages/QuantLabInfo";

export const metadata = {
  title: "MarketMinute | Quant Lab",
  description: "Quantitative model predictions and research tools",
};

export default async function QuantLabPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return <QuantLabInfo />;
  }

  // Get user's active watchlist
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
      {/* Disclaimer Header */}
      <div className="rounded-lg border-2 border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <div className="text-amber-500 text-2xl">⚠️</div>
          <div>
            <h2 className="text-lg font-bold text-amber-500 mb-2">
              Quant Lab – Educational & Research Tool
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              <strong>Not Financial Advice:</strong> All model outputs are
              hypothetical probabilities based on historical patterns. Past
              performance does not guarantee future results. These tools are for
              research and educational purposes only. Do not use this as your
              sole basis for investment decisions.
            </p>
          </div>
        </div>
      </div>
      <WatchlistSelector
        watchlists={user?.watchlists ?? []}
        activeWatchlist={activeWatchlist ?? null}
        showManageButton
      />
      {/* Quant Lab Content */}
      <QuantLabClient symbols={symbols} watchlistName={activeWatchlist?.name} />
    </div>
  );
}
