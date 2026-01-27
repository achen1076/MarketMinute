"use client";

import { useEffect, useState } from "react";
import Card from "@/components/atoms/Card";
import { Prediction, ModelQuality } from "@/types/quant";

export default function TradeableSignals() {
  const [signals, setSignals] = useState<Prediction[]>([]);
  const [modelMetadata, setModelMetadata] = useState<
    Record<string, ModelQuality>
  >({});
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    fetchSignals();
    fetchMetadata();
  }, []);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quant/predictions");
      const data = await res.json();

      // Filter for should_trade = true
      const tradeable = data.predictions.filter(
        (p: Prediction) => p.should_trade,
      );

      setSignals(tradeable);
      setTimestamp(data.timestamp);
    } catch (error) {
      console.error("Failed to fetch signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await fetch("/api/quant/model-metadata");
      const data = await res.json();
      setModelMetadata(data.models || {});
    } catch (error) {
      console.error("Failed to fetch model metadata:", error);
    }
  };

  const getQualityColor = (tier: string | undefined) => {
    switch (tier) {
      case "excellent":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "good":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "marginal":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "poor":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  const getQualityLabel = (tier: string | undefined) => {
    switch (tier) {
      case "excellent":
        return "Best";
      case "good":
        return "Excellent";
      case "marginal":
        return "Good";
      case "poor":
        return "Low";
      default:
        return "N/A";
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "BUY":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "SELL":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Tradeable Signals Today</h2>
        <p className="text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Tradeable Signals Today</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {signals.length} signal{signals.length !== 1 ? "s" : ""} with
            should_trade = true
          </p>
        </div>
        {timestamp && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="text-sm font-medium">
              {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {signals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No tradeable signals for today
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Ticker
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Signal
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Current Price
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Take Profit
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Stop Loss
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                  TP %
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                  SL %
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Confidence
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Model Quality
                </th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => {
                const tpPercent = signal.take_profit
                  ? ((signal.take_profit - signal.current_price) /
                      signal.current_price) *
                    100
                  : null;
                const slPercent = signal.stop_loss
                  ? ((signal.stop_loss - signal.current_price) /
                      signal.current_price) *
                    100
                  : null;

                return (
                  <tr
                    key={signal.ticker}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground">
                        {signal.ticker}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getSignalColor(
                          signal.signal,
                        )}`}
                      >
                        {signal.signal}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      ${signal.current_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {signal.take_profit ? (
                        <span className="text-emerald-400 font-semibold">
                          ${signal.take_profit.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {signal.stop_loss ? (
                        <span className="text-rose-400 font-semibold">
                          ${signal.stop_loss.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tpPercent !== null ? (
                        <span className="text-emerald-400 text-sm font-medium">
                          +{tpPercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {slPercent !== null ? (
                        <span className="text-rose-400 text-sm font-medium">
                          {slPercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium">
                        {(signal.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getQualityColor(
                          modelMetadata[signal.ticker]?.quality_tier,
                        )}`}
                      >
                        {getQualityLabel(
                          modelMetadata[signal.ticker]?.quality_tier,
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={fetchSignals}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Refresh Signals
        </button>
      </div>
    </Card>
  );
}
