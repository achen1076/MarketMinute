import WatchlistSelector from "@/components/organisms/WatchlistSelector";

type WatchlistItem = {
  id: string;
  symbol: string;
  notes?: string | null;
};

type Watchlist = {
  id: string;
  name: string;
  items: WatchlistItem[];
  isFavorite: boolean;
};

type Props = {
  watchlists: Watchlist[];
  activeWatchlist: Watchlist | null;
};

export default function DashboardClient({
  watchlists,
  activeWatchlist,
}: Props) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Your Mintalyze Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your favorite stocks and stay updated on market movements.
        </p>
      </header>

      <WatchlistSelector
        watchlists={watchlists}
        activeWatchlist={activeWatchlist}
        showManageButton
      />
    </div>
  );
}
