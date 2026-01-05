"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Card from "@/components/atoms/Card";
import { ForecastCard } from "@/components/molecules/ForecastCard";
import type { DistributionalForecast } from "@/types/quant";

type Props = {
  symbols: string[];
  watchlistName?: string;
};

export function MarketForecastsClient({ symbols, watchlistName }: Props) {
  const [forecasts, setForecasts] = useState<DistributionalForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredForecasts = forecasts.filter((f) =>
    f.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchForecasts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quant/forecasts");

      if (response.ok) {
        const data = await response.json();
        const allForecasts = data.forecasts || [];
        const filtered = allForecasts.filter((f: DistributionalForecast) =>
          symbols.includes(f.ticker)
        );
        setForecasts(filtered);
      } else {
        setError("Failed to load forecasts");
      }
    } catch (err) {
      console.error("Failed to fetch forecasts:", err);
      setError("Failed to load forecasts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, [symbols]);

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Loading forecasts...</div>
      </Card>
    );
  }

  if (error || forecasts.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div>
            <div className="font-semibold">No forecasts available</div>
            <div className="text-md mt-3 space-y-2">
              <p className="text-sm">This means:</p>
              <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                <li>No watchlist is selected</li>
                <li>Your watchlist symbols are not in the trained models</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Market Forecasts{" "}
          {watchlistName && (
            <span className="text-muted-foreground">- {watchlistName}</span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Distributional forecasts showing expected ranges, conviction levels,
          and probability distributions
        </p>
      </div>

      {/* Search */}
      <div className="relative w-fit">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search ticker..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-3 py-2 w-40 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredForecasts.map((forecast) => (
          <ForecastCard key={forecast.ticker} forecast={forecast} />
        ))}
      </div>
    </div>
  );
}
