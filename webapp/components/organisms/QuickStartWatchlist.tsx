"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/atoms/Card";
import {
  Rocket,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Zap,
  ShoppingCart,
  Cpu,
} from "lucide-react";

const STARTER_PACKS = {
  marketLeaders: {
    name: "Tech Giants",
    description: "Top tech giants driving the market",
    symbols: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO"],
    icon: Cpu,
    color: "from-emerald-500 to-teal-500",
  },
  growthWatchlist: {
    name: "Growth Watchlist",
    description:
      "High-growth companies with strong revenue expansion and market momentum",
    symbols: ["NVDA", "MSFT", "META", "AMZN", "CRM", "LLY", "SHOP", "NFLX"],
    icon: TrendingUp,
    color: "from-fuchsia-500 to-purple-600",
  },
  consumer: {
    name: "Consumer & Retail",
    description: "Companies tied to consumer spending trends",
    symbols: ["AMZN", "WMT", "TGT", "COST", "HD", "NKE", "LULU", "CMG"],
    icon: ShoppingCart,
    color: "from-pink-500 to-rose-500",
  },
  highVolatility: {
    name: "High Volatility",
    description: "Stocks that move fast on news and sentiment shifts",
    symbols: ["TSLA", "NVDA", "AMD", "COIN", "RIVN", "PLTR", "SNOW", "NET"],
    icon: Zap,
    color: "from-orange-500 to-red-500",
  },
};

export default function QuickStartWatchlist() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateStarterPack = async (
    packKey: keyof typeof STARTER_PACKS
  ) => {
    setLoading(true);
    setError(null);

    const pack = STARTER_PACKS[packKey];

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pack.name,
          symbols: pack.symbols,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create watchlist");
      }

      const watchlist = await res.json();

      // Set as active watchlist
      await fetch("/api/user/active-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchlistId: watchlist.id }),
      });

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handleCreate = async (packKey: keyof typeof STARTER_PACKS) => {
    setLoadingPack(packKey);
    await handleCreateStarterPack(packKey);
    setLoadingPack(null);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="p-6 border-dashed border-2 border-muted-foreground/20">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold">Welcome to Mintalyze!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get started by creating your first watchlist. Track stocks, get
            AI-powered insights, and never miss important market movements.
          </p>
        </div>
      </Card>

      {/* Quick Start Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-md font-semibold text-foreground">
            Quick Start - Choose a Starter Pack
          </h3>
        </div>
        {/* 2x2 Grid of Starter Packs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            Object.entries(STARTER_PACKS) as [
              keyof typeof STARTER_PACKS,
              (typeof STARTER_PACKS)[keyof typeof STARTER_PACKS]
            ][]
          ).map(([key, pack]) => {
            const IconComponent = pack.icon;
            const isLoading = loadingPack === key;
            return (
              <Card
                key={key}
                className="p-4 hover:border-emerald-500/50 transition-colors group"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`p-2.5 rounded-xl bg-linear-to-br ${pack.color}`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm">
                        {pack.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {pack.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {pack.symbols.slice(0, 6).map((symbol) => (
                      <span
                        key={symbol}
                        className="px-1.5 py-0.5 text-xs font-medium bg-muted rounded text-muted-foreground"
                      >
                        {symbol}
                      </span>
                    ))}
                    {pack.symbols.length > 6 && (
                      <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                        +{pack.symbols.length - 6}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCreate(key)}
                    disabled={loading}
                    className="mt-auto w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
        <h3 className="text-md font-semibold text-foreground">
          or{" "}
          <a href="/watchlist" className="text-emerald-500 hover:underline">
            create your own watchlist...
          </a>
        </h3>
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
}
