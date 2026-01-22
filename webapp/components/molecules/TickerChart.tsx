"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { COLORS } from "@shared/lib/colors";

type TimeRange = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y";

interface TickerChartProps {
  symbol: string;
  currentPrice?: number;
  changePct?: number;
  previousClose?: number;
}

export function TickerChart({
  symbol,
  currentPrice: tickerPrice,
  changePct: tickerChangePct,
  previousClose: tickerPrevClose,
}: TickerChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1D");
  const [chartData, setChartData] = useState<
    Array<{ date: string; close: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeRanges: TimeRange[] = [
    "1D",
    "5D",
    "1M",
    "3M",
    "6M",
    "YTD",
    "1Y",
    "5Y",
  ];

  useEffect(() => {
    fetchChartData();
  }, [symbol, selectedRange]);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/historical-prices?symbol=${symbol}&range=${selectedRange}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch chart data");
      }

      const data = await res.json();
      setChartData(data.prices || []);
    } catch (err) {
      console.error("Chart data error:", err);
      setError("Failed to load chart");
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);

    if (selectedRange === "1D") {
      const hour = date.getHours();
      const minute = date.getMinutes();

      if (hour === 9 && minute >= 30 && minute < 35) return "9:30";
      if (hour === 12 && minute >= 0 && minute < 5) return "12:00";
      if (hour === 14 && minute >= 0 && minute < 5) return "2:00";
      if (hour === 15 && minute >= 58 && minute < 60) return "4:00";
      return "";
    } else if (selectedRange === "5D") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (selectedRange === "1M" || selectedRange === "3M") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
    }
  };

  const getCustomTicks = () => {
    if (selectedRange !== "1D" || chartData.length === 0) return undefined;

    const targetTimes = [570, 720, 840, 960];
    const ticks: string[] = [];

    for (const targetMinutes of targetTimes) {
      let closestPoint = null;
      let closestDiff = Infinity;

      for (const point of chartData) {
        const date = new Date(point.date);
        const pointMinutes = date.getHours() * 60 + date.getMinutes();
        const diff = Math.abs(pointMinutes - targetMinutes);

        if (diff < closestDiff) {
          closestDiff = diff;
          closestPoint = point.date;
        }
      }

      if (closestPoint && closestDiff < 60) {
        ticks.push(closestPoint);
      }
    }

    return ticks;
  };

  const chartOpenPrice = chartData.length > 0 ? chartData[0].close : 0;

  const formatTooltip = (value: number | undefined) => {
    if (value === undefined) return "";
    const refPrice =
      selectedRange === "1D" && tickerPrevClose
        ? tickerPrevClose
        : chartOpenPrice;
    if (refPrice > 0) {
      const pctChange = ((value - refPrice) / refPrice) * 100;
      const sign = pctChange >= 0 ? "+" : "";
      return [`$${value.toFixed(2)}`, `${sign}${pctChange.toFixed(2)}%`];
    }
    return `$${value.toFixed(2)}`;
  };

  const chartCurrentPrice =
    chartData.length > 0 ? chartData[chartData.length - 1].close : 0;

  const useTickerData =
    selectedRange === "1D" &&
    tickerPrice !== undefined &&
    tickerChangePct !== undefined;
  const displayPrice = useTickerData ? tickerPrice : chartCurrentPrice;
  const displayChangePct = useTickerData
    ? tickerChangePct
    : chartOpenPrice > 0
    ? ((chartCurrentPrice - chartOpenPrice) / chartOpenPrice) * 100
    : 0;
  const displayPriceChange =
    useTickerData && tickerPrevClose
      ? tickerPrice - tickerPrevClose
      : chartCurrentPrice - chartOpenPrice;
  const isPositive = displayChangePct >= 0;
  const chartColor = isPositive ? "#10b981" : "#ef4444";

  const showOpenLine = ["1D", "5D", "1M"].includes(selectedRange);
  const referenceLinePrice =
    selectedRange === "1D" && tickerPrevClose
      ? tickerPrevClose
      : chartOpenPrice;

  const calculateYAxisDomain = (): [number, number] => {
    if (chartData.length === 0) return [0, 100];

    const prices = chartData.map((d) => d.close);
    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);

    if (showOpenLine && referenceLinePrice > 0) {
      minPrice = Math.min(minPrice, referenceLinePrice);
      maxPrice = Math.max(maxPrice, referenceLinePrice);
    }

    return [minPrice, maxPrice];
  };

  return (
    <div className="space-y-3">
      {/* Price and percent change header */}
      {(chartData.length > 0 || useTickerData) && (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-foreground">
            ${displayPrice.toFixed(2)}
          </span>
          <span
            className={`text-sm font-medium ${
              isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {displayPriceChange.toFixed(2)} ({isPositive ? "+" : ""}
            {displayChangePct.toFixed(2)}%)
          </span>
        </div>
      )}

      {/* Time range selector */}
      <div className="flex gap-1 justify-center flex-wrap">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedRange === range
                ? "bg-muted text-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="h-64 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading chart...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-rose-400 text-sm">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                ticks={getCustomTicks()}
                stroke="#64748b"
                style={{ fontSize: "11px" }}
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />
              <YAxis
                domain={calculateYAxisDomain()}
                stroke="#64748b"
                style={{ fontSize: "11px" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(2)}`}
                width={45}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length || !label)
                    return null;
                  const price = payload[0].value as number;
                  const refPrice =
                    selectedRange === "1D" && tickerPrevClose
                      ? tickerPrevClose
                      : chartOpenPrice;
                  const pctChange =
                    refPrice > 0 ? ((price - refPrice) / refPrice) * 100 : 0;
                  const pctPositive = pctChange >= 0;
                  const date = new Date(label as string);
                  const dateStr = date.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour:
                      selectedRange === "1D" || selectedRange === "5D"
                        ? "numeric"
                        : undefined,
                    minute:
                      selectedRange === "1D" || selectedRange === "5D"
                        ? "2-digit"
                        : undefined,
                  });
                  return (
                    <div className="bg-card border border-border rounded-lg px-3 py-2">
                      <div className="text-muted-foreground text-xs mb-1">
                        {dateStr}
                      </div>
                      <div className="text-foreground text-sm font-medium">
                        ${price.toFixed(2)}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          pctPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {pctPositive ? "+" : ""}
                        {pctChange.toFixed(2)}%
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={chartColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
                name="Price"
              />
              {showOpenLine && referenceLinePrice > 0 && (
                <ReferenceLine
                  y={referenceLinePrice}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
