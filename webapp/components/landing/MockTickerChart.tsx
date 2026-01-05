"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type TimeRange = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y";

interface MockTickerChartProps {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  changePct: number;
  previousClose: number;
}

// Seeded random number generator for consistent charts per symbol
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generate realistic intraday chart pattern based on the screenshot
// Pattern: Morning spike up, sharp selloff, then sideways consolidation with small recovery
function generateIntradayPattern(
  symbol: string,
  currentPrice: number,
  changePct: number,
  previousClose: number
) {
  const points: Array<{ date: string; close: number }> = [];
  const seed =
    symbol.charCodeAt(0) * 100 + symbol.charCodeAt(symbol.length - 1);

  // Trading day: 9:30 AM to 4:00 PM (390 minutes, ~78 5-min candles)
  const numPoints = 78;
  const startDate = new Date();
  startDate.setHours(9, 30, 0, 0);

  // Calculate the high point based on symbol characteristics
  // For negative days, the high was earlier and we sold off
  // For positive days, we rallied from lows
  const isNegative = changePct < 0;

  // Price levels
  const dayOpen = previousClose * (1 + (seededRandom(seed) - 0.5) * 0.005);

  // For negative stocks: spike up early then sell off hard
  // For positive stocks: sell off early then recover
  let morningHigh: number;
  let morningLow: number;
  let afternoonLevel: number;

  if (isNegative) {
    // Like AAPL in screenshot: spike to ~277, crash to ~270, consolidate ~271
    morningHigh =
      previousClose *
      (1 + Math.abs(changePct) * 0.02 + seededRandom(seed + 1) * 0.015);
    morningLow = currentPrice * (1 - seededRandom(seed + 2) * 0.008);
    afternoonLevel = currentPrice;
  } else {
    // Positive day: dip early, then steady climb
    morningLow = previousClose * (1 - seededRandom(seed + 1) * 0.01);
    morningHigh = currentPrice * (1 + seededRandom(seed + 2) * 0.005);
    afternoonLevel = currentPrice;
  }

  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    const date = new Date(startDate);
    date.setMinutes(date.getMinutes() + i * 5);

    let price: number;

    if (isNegative) {
      // Negative day pattern: spike up first 15-20%, then sharp selloff, then consolidation
      if (progress < 0.15) {
        // Morning rally (9:30-10:30): Sharp spike up
        const rallyProgress = progress / 0.15;
        const easeOut = 1 - Math.pow(1 - rallyProgress, 2);
        price = dayOpen + (morningHigh - dayOpen) * easeOut;
      } else if (progress < 0.35) {
        // Selloff (10:30-12:00): Sharp drop
        const selloffProgress = (progress - 0.15) / 0.2;
        const easeIn = Math.pow(selloffProgress, 1.5);
        price = morningHigh - (morningHigh - morningLow) * easeIn;
      } else {
        // Afternoon consolidation (12:00-4:00): Sideways with slight volatility
        const consolProgress = (progress - 0.35) / 0.65;
        const basePrice =
          morningLow + (afternoonLevel - morningLow) * consolProgress * 0.3;
        // Add choppy sideways movement
        const chop =
          Math.sin(i * 0.8) * 0.002 +
          Math.sin(i * 1.5) * 0.001 +
          Math.sin(i * 0.3) * 0.0015;
        price = basePrice * (1 + chop);
      }
    } else {
      // Positive day pattern: early weakness then recovery
      if (progress < 0.1) {
        // Early dip
        const dipProgress = progress / 0.1;
        price = dayOpen - (dayOpen - morningLow) * dipProgress;
      } else if (progress < 0.4) {
        // Recovery phase
        const recoveryProgress = (progress - 0.1) / 0.3;
        const easeOut = 1 - Math.pow(1 - recoveryProgress, 2);
        price = morningLow + (morningHigh - morningLow) * easeOut * 0.7;
      } else {
        // Afternoon grind higher
        const grindProgress = (progress - 0.4) / 0.6;
        const basePrice = morningLow + (morningHigh - morningLow) * 0.7;
        price = basePrice + (afternoonLevel - basePrice) * grindProgress;
        // Small volatility
        const noise = Math.sin(i * 0.6) * 0.001 + Math.cos(i * 1.2) * 0.0008;
        price = price * (1 + noise);
      }
    }

    // Add micro-noise for realism
    const microNoise = (seededRandom(seed + i * 3) - 0.5) * 0.001;
    price = price * (1 + microNoise);

    points.push({
      date: date.toISOString(),
      close: Math.round(price * 100) / 100,
    });
  }

  // Ensure last point is current price
  if (points.length > 0) {
    points[points.length - 1].close = currentPrice;
  }

  return points;
}

// Generate mock chart data based on symbol and time range
function generateMockChartData(
  symbol: string,
  range: TimeRange,
  currentPrice: number,
  changePct: number,
  previousClose?: number
) {
  // Use intraday pattern for 1D
  if (range === "1D") {
    const prevClose = previousClose || currentPrice / (1 + changePct / 100);
    return generateIntradayPattern(symbol, currentPrice, changePct, prevClose);
  }

  const points: Array<{ date: string; close: number }> = [];
  const seed =
    symbol.charCodeAt(0) * 100 + symbol.charCodeAt(symbol.length - 1);

  let numPoints: number;
  let startDate = new Date();

  switch (range) {
    case "5D":
      numPoints = 50;
      startDate.setDate(startDate.getDate() - 5);
      break;
    case "1M":
      numPoints = 22;
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3M":
      numPoints = 65;
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "6M":
      numPoints = 130;
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "YTD":
      numPoints = 250;
      startDate = new Date(startDate.getFullYear(), 0, 1);
      break;
    case "1Y":
      numPoints = 252;
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "5Y":
      numPoints = 260;
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
  }

  // Calculate starting price with larger historical range
  const historicalChange =
    range === "5Y" ? 2.5 : range === "1Y" ? 0.8 : range === "6M" ? 0.4 : 0.15;
  const startPrice =
    currentPrice / (1 + historicalChange * (changePct >= 0 ? 1 : -0.5));

  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);

    // Create realistic trend with pullbacks
    let trendValue = progress;
    // Add some waves/pullbacks
    trendValue += Math.sin(progress * Math.PI * 3) * 0.08;
    trendValue += Math.sin(progress * Math.PI * 7) * 0.04;
    trendValue = Math.max(0, Math.min(1, trendValue));

    let price = startPrice + (currentPrice - startPrice) * trendValue;

    // Add volatility
    const noise = (seededRandom(seed + i * 7) - 0.5) * 0.03;
    price = price * (1 + noise);

    const date = new Date(startDate);
    if (range === "5D") {
      date.setHours(date.getHours() + i * 2);
    } else {
      date.setDate(date.getDate() + Math.floor(i * (range === "5Y" ? 7 : 1)));
    }

    points.push({
      date: date.toISOString(),
      close: Math.round(price * 100) / 100,
    });
  }

  if (points.length > 0) {
    points[points.length - 1].close = currentPrice;
  }

  return points;
}

export function MockTickerChart({
  symbol,
  currentPrice,
  priceChange,
  changePct,
}: MockTickerChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1D");

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

  const chartData = generateMockChartData(
    symbol,
    selectedRange,
    currentPrice,
    changePct
  );
  const chartOpenPrice =
    chartData.length > 0 ? chartData[0].close : currentPrice;

  const isPositive = changePct >= 0;
  const chartColor = isPositive ? "#10b981" : "#ef4444";

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);

    if (selectedRange === "1D") {
      const hour = date.getHours();
      const minute = date.getMinutes();

      if (hour === 9 && minute >= 30 && minute < 35) return "9:30";
      if (hour === 12 && minute >= 0 && minute < 5) return "12:00";
      if (hour === 14 && minute >= 0 && minute < 5) return "2:00";
      if (hour === 15 && minute >= 58 && minute <= 60) return "4:00";
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

  const calculateYAxisDomain = (): [number, number] => {
    if (chartData.length === 0) return [0, 100];

    const prices = chartData.map((d) => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return [minPrice * 0.998, maxPrice * 1.002];
  };

  return (
    <div className="space-y-3">
      {/* Price and percent change header */}
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-foreground">
          ${currentPrice.toFixed(2)}
        </span>
        <span
          className={`text-sm font-medium ${
            isPositive ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {priceChange.toFixed(2)} ({isPositive ? "+" : ""}
          {changePct.toFixed(2)}%)
        </span>
      </div>

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
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`colorPrice-${symbol}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#64748b"
              style={{ fontSize: "10px" }}
              tickLine={false}
              axisLine={false}
              minTickGap={50}
            />
            <YAxis
              domain={calculateYAxisDomain()}
              stroke="#64748b"
              style={{ fontSize: "10px" }}
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
                const pctChange =
                  chartOpenPrice > 0
                    ? ((price - chartOpenPrice) / chartOpenPrice) * 100
                    : 0;
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
              fill={`url(#colorPrice-${symbol})`}
              name="Price"
            />
            {["1D", "5D", "1M"].includes(selectedRange) &&
              chartOpenPrice > 0 && (
                <ReferenceLine
                  y={chartOpenPrice}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
