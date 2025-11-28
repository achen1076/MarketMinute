"use client";

import { useState, useEffect } from "react";
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
        <div className="text-slate-400">Loading forecasts...</div>
      </Card>
    );
  }

  if (error || forecasts.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-3 text-slate-400">
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
        <h1 className="text-2xl font-bold text-slate-100">
          Market Forecasts{" "}
          {watchlistName && (
            <span className="text-slate-400">- {watchlistName}</span>
          )}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Distributional forecasts showing expected ranges, conviction levels,
          and probability distributions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {forecasts.map((forecast) => (
          <ForecastCard key={forecast.ticker} forecast={forecast} />
        ))}
      </div>
    </div>
  );
}
