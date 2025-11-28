import Card from "@/components/atoms/Card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DistributionalForecast } from "@/types/quant";

export function ForecastCard({
  forecast,
}: {
  forecast: DistributionalForecast;
}) {
  const {
    ticker,
    current_price,
    expected_range_pct,
    upper_bound,
    lower_bound,
    directional_bias,
    conviction,
    most_likely_category,
    prob_large_up,
    prob_mild_up,
    prob_flat,
    prob_mild_down,
    prob_large_down,
    p10,
    p50,
    p90,
  } = forecast;

  const upside_pct = ((upper_bound - current_price) / current_price) * 100;
  const downside_pct = ((lower_bound - current_price) / current_price) * 100;

  const getCategoryLabel = (cat: string) => {
    const labels = {
      large_up: "Large Up (>2%)",
      mild_up: "Mild Up (0.5-2%)",
      flat: "Flat (±0.5%)",
      mild_down: "Mild Down (0.5-2%)",
      large_down: "Large Down (>2%)",
    };
    return labels[cat as keyof typeof labels] || cat;
  };

  const getConvictionColor = (level: string) => {
    if (level === "High") return "text-emerald-400";
    if (level === "Medium") return "text-amber-400";
    return "text-slate-400";
  };

  const getBiasIcon = () => {
    if (directional_bias === "Bullish") return TrendingUp;
    if (directional_bias === "Bearish") return TrendingDown;
    return Minus;
  };

  const BiasIcon = getBiasIcon();
  const biasColor =
    directional_bias === "Bullish"
      ? "text-emerald-400"
      : directional_bias === "Bearish"
      ? "text-rose-400"
      : "text-slate-400";

  return (
    <Card className="p-5 hover:bg-slate-900/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">{ticker}</h3>
          <p className="text-sm text-slate-400">${current_price.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Conviction</p>
          <p
            className={`text-sm font-semibold ${getConvictionColor(
              conviction
            )}`}
          >
            {conviction}
          </p>
        </div>
      </div>

      {/* Expected Range */}
      <div className="mb-4 p-3 rounded-lg bg-slate-800/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-500">Tomorrow's Expected Range</p>
          <div className={`flex items-center gap-1 text-xs ${biasColor}`}>
            <BiasIcon size={12} />
            <span>{directional_bias} bias</span>
          </div>
        </div>
        <p className="text-lg font-semibold text-slate-100">
          ±{expected_range_pct}%
        </p>
        <p className="text-sm text-slate-400 mt-1">
          (+{upside_pct.toFixed(1)}% to {downside_pct.toFixed(1)}%)
        </p>
      </div>

      {/* Price Percentiles */}
      <div className="mb-4 p-3 rounded-lg bg-slate-800/40">
        <p className="text-xs text-slate-500 mb-3">
          Price Percentiles (68% range)
        </p>
        <div className="flex items-center justify-between text-sm">
          <div className="text-center flex-1">
            <p className="text-rose-400 font-semibold">${p10.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">10th</p>
          </div>
          <div className="text-center flex-1 border-x border-slate-700 mx-2 px-2">
            <p className="text-slate-100 font-bold">${p50.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">Median</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-emerald-400 font-semibold">${p90.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">90th</p>
          </div>
        </div>
      </div>

      {/* Magnitude Distribution */}
      <div>
        <p className="text-xs text-slate-500 mb-2">
          Move Probability Distribution
        </p>
        <div className="space-y-2">
          {[
            { category: "large_up", prob: prob_large_up },
            { category: "mild_up", prob: prob_mild_up },
            { category: "flat", prob: prob_flat },
            { category: "mild_down", prob: prob_mild_down },
            { category: "large_down", prob: prob_large_down },
          ].map(({ category, prob }) => {
            const isLikely = category === most_likely_category;
            const barColor = category.includes("up")
              ? "bg-emerald-500"
              : category === "flat"
              ? "bg-slate-500"
              : "bg-rose-500";

            return (
              <div key={category} className="flex items-center gap-2">
                <span
                  className={`text-xs w-32 ${
                    isLikely ? "text-slate-100 font-medium" : "text-slate-400"
                  }`}
                >
                  {getCategoryLabel(category)}
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${prob * 100}%` }}
                  />
                </div>
                <span
                  className={`text-xs w-10 text-right tabular-nums ${
                    isLikely ? "text-slate-100 font-medium" : "text-slate-400"
                  }`}
                >
                  {(prob * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
