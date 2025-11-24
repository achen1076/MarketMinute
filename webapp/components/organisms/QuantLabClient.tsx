"use client";

import { useState, useEffect } from "react";
import Card from "@/components/atoms/Card";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Prediction = {
  ticker: string;
  timestamp: string;
  current_price: number;
  signal: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  prob_up: number;
  prob_neutral: number;
  prob_down: number;
  should_trade: boolean;
  take_profit: number | null;
  stop_loss: number | null;
  atr: number;
};

type EnhancedSignal = Prediction & {
  quantScore: number;
  edge: number;
  edgeDirectional: number;
  regime: string;
  expectedReturn: number;
  expectedVolatility: number;
  prob1PctMove: number;
  prob2PctMove: number;
  signalDescription: string;
  tradingInterpretation: string;
  isTradeable: boolean;
};

type DistributionalForecast = {
  ticker: string;
  current_price: number;
  timestamp: string;
  expected_range_pct: number;
  upper_bound: number;
  lower_bound: number;
  directional_bias: "Bullish" | "Bearish" | "Neutral";
  conviction: "Low" | "Medium" | "High";
  conviction_score: number;
  most_likely_category:
    | "large_up"
    | "mild_up"
    | "flat"
    | "mild_down"
    | "large_down";
  prob_large_up: number;
  prob_mild_up: number;
  prob_flat: number;
  prob_mild_down: number;
  prob_large_down: number;
  p10: number;
  p50: number;
  p90: number;
};

type Props = {
  symbols: string[];
  watchlistName?: string;
};

const calculateSignalMetrics = (pred: Prediction): EnhancedSignal => {
  const { prob_up, prob_down, prob_neutral, confidence, atr, current_price } =
    pred;

  const edge = Math.abs(prob_up - prob_down);
  const edgeDirectional = prob_up - prob_down;
  const directionalBias =
    prob_up > prob_down ? prob_up - prob_down : -(prob_down - prob_up);

  // Convert ATR from dollars to percentage of current price
  const volatility = atr ? atr / current_price : 0.02;

  const expectedReturn = directionalBias * volatility;
  const expectedVolatility = volatility * (1 + edge);

  const regime = (() => {
    if (prob_neutral > 0.85) return "low-vol chop";
    if (edge > 0.15 && confidence > 0.7) return "trending";
    if (edge > 0.1 && volatility > 0.03) return "high-vol breakout";
    if (edge < 0.05) return "reverting";
    return "mixed";
  })();

  const prob1PctMove = prob_up + prob_down;
  const prob2PctMove = Math.max(0, (prob_up + prob_down) * 0.7);

  const trendFactor = 1 - prob_neutral;
  const directionStrength = Math.max(prob_up, prob_down);

  const EDGE_WEIGHT = 70;
  const TREND_WEIGHT = 40;
  const DIR_WEIGHT = 30;
  const CONF_WEIGHT = 15;

  let quantScore =
    edge * EDGE_WEIGHT +
    trendFactor * TREND_WEIGHT +
    directionStrength * DIR_WEIGHT +
    confidence * CONF_WEIGHT;

  if (regime === "trending") quantScore *= 1.08;
  if (regime === "high-vol breakout") quantScore *= 1.12;
  if (regime === "low-vol chop") quantScore *= 0.75;
  if (regime === "reverting") quantScore *= 0.9;

  quantScore = Math.min(100, Math.max(0, quantScore));
  quantScore = Math.round(quantScore);

  const signalDescription = (() => {
    if (quantScore >= 70) {
      return `Strong ${directionalBias > 0 ? "Bullish" : "Bearish"} Edge (+${(
        Math.abs(expectedReturn) * 100
      ).toFixed(2)}%) — ${regime}`;
    } else if (quantScore >= 50) {
      return `${
        directionalBias > 0 ? "Bullish" : "Bearish"
      } Bias — ${regime} regime`;
    } else if (quantScore >= 30) {
      return `Weak ${
        directionalBias > 0 ? "bullish" : "bearish"
      } lean — ${regime}`;
    } else {
      return `Neutral — ${regime} (no trade)`;
    }
  })();

  const tradingInterpretation = (() => {
    if (quantScore >= 70 && edge > 0.15) {
      return "Strong statistical edge detected — highest conviction setup.";
    } else if (quantScore >= 60 && regime === "trending") {
      return "Clear directional momentum — favored for trend-following strategies.";
    } else if (quantScore >= 50 && regime === "high-vol breakout") {
      return "Elevated volatility with directional bias — suitable for active monitoring.";
    } else if (quantScore >= 40) {
      return "Modest edge present, but requires confirmation from other analysis tools.";
    } else if (quantScore >= 30 && volatility < 0.015) {
      return `Weak ${
        directionalBias > 0 ? "bullish" : "bearish"
      } lean, but low volatility dampens conviction.`;
    } else if (quantScore >= 25 && regime === "reverting") {
      return "Mean-reversion setup detected — consider waiting for clearer signals.";
    } else if (regime === "low-vol chop") {
      return "Model sees low/neutral chop — intraday traders may prefer to wait.";
    } else if (edge < 0.03) {
      return "No clear edge — staying on sidelines recommended.";
    } else {
      return "Mixed signals with low conviction — better opportunities likely elsewhere.";
    }
  })();

  const isTradeable = quantScore >= 35 && edge > 0.05;

  return {
    ...pred,
    quantScore,
    edge,
    edgeDirectional,
    regime,
    expectedReturn,
    expectedVolatility,
    prob1PctMove,
    prob2PctMove,
    signalDescription,
    tradingInterpretation,
    isTradeable,
  };
};

export function QuantLabClient({ symbols, watchlistName }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [enhancedSignals, setEnhancedSignals] = useState<EnhancedSignal[]>([]);
  const [viewMode, setViewMode] = useState<"signals" | "top">("top");
  const [sortBy, setSortBy] = useState<"default" | "score" | "name">("default");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quantlab-methodology-visible");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [showLimitations, setShowLimitations] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quantlab-limitations-visible");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quant/predictions");

      if (response.ok) {
        const data = await response.json();
        const allPredictions = data.predictions || [];
        const filtered = allPredictions.filter((p: Prediction) =>
          symbols.includes(p.ticker)
        );
        setPredictions(filtered);
        const enhanced = filtered.map(calculateSignalMetrics);
        setEnhancedSignals(enhanced);
      } else {
        setError("Failed to load predictions");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [symbols]);

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-slate-400">Loading model predictions...</div>
      </Card>
    );
  }

  // Calculate summary stats
  const bullishCount = predictions.filter((p) => p.signal === "BUY").length;
  const bearishCount = predictions.filter((p) => p.signal === "SELL").length;
  const neutralCount = predictions.filter((p) => p.signal === "NEUTRAL").length;
  const totalCount = predictions.length;

  const toggleMethodology = () => {
    const newValue = !showMethodology;
    setShowMethodology(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem("quantlab-methodology-visible", String(newValue));
    }
  };

  const toggleLimitations = () => {
    const newValue = !showLimitations;
    setShowLimitations(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem("quantlab-limitations-visible", String(newValue));
    }
  };

  const getSortedSignals = () => {
    if (sortBy === "score") {
      return [...enhancedSignals].sort((a, b) => b.quantScore - a.quantScore);
    } else if (sortBy === "name") {
      return [...enhancedSignals].sort((a, b) =>
        a.ticker.localeCompare(b.ticker)
      );
    } else {
      // Default: maintain watchlist order (already in symbols order)
      return enhancedSignals;
    }
  };

  if (error || predictions.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-3 text-slate-400">
          <div>
            <div className="font-semibold">No predictions available</div>
            <div className="text-md mt-3 space-y-2">
              <p className="text-sm">This means:</p>
              <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                <li>No watchlist is selected</li>
                <li>
                  Your watchlist symbols are not in the trained model (currently
                  trained on ~200 tickers)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Quant Lab Signals{" "}
              {watchlistName && (
                <span className="text-slate-400">- {watchlistName}</span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              AI-generated trading signals with Quant Scores, regime
              classification, and expected metrics
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("top")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "top"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800"
                }`}
              >
                Top Signals
              </button>
              <button
                onClick={() => setViewMode("signals")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "signals"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800"
                }`}
              >
                All Signals
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Sort Dropdown - only show for All Signals view */}
      {viewMode === "signals" && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-slate-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "default" | "score" | "name")
            }
            className="px-3 py-2 rounded-lg text-sm bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="default">Default</option>
            <option value="score">Quant Score</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      )}
      {/* View Modes */}
      {viewMode === "top" ? (
        <div className="space-y-4">
          <TopSignalsView signals={enhancedSignals} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {getSortedSignals().map((signal) => (
            <EnhancedPredictionCard key={signal.ticker} signal={signal} />
          ))}
        </div>
      )}

      {/* Methodology */}
      <Card className="p-6">
        <button
          onClick={toggleMethodology}
          className="w-full flex items-center justify-between text-left mb-3 hover:text-teal-400 transition-colors"
        >
          <h3 className="text-lg font-bold text-slate-200">How It Works</h3>
          {showMethodology ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>
        {showMethodology && (
          <div className="space-y-3 text-sm text-slate-300">
            <div>
              <strong className="text-slate-200">Signal Processing:</strong> Our
              signal engine transforms neutral-dominant predictions into
              actionable insights. Each stock receives a Quant Score (0-100)
              based on edge, confidence, and regime characteristics.
            </div>
            <div>
              <strong className="text-slate-200">Quant Score:</strong> A single
              number combining multiple factors: directional edge (difference
              between up/down probabilities), model confidence, and expected
              volatility.
            </div>
            <div>
              <strong className="text-slate-200">Regime Classification:</strong>{" "}
              Each stock is classified into regimes: trending (strong
              directional edge), high-vol breakout (large moves expected),
              low-vol chop (neutral-dominated), reverting (mean-reversion), or
              mixed.
            </div>
            <div>
              <strong className="text-slate-200">
                Expected Directional Impact:
              </strong>{" "}
              Calculated as directional bias × volatility, this metric estimates
              the potential magnitude and direction of price movement based on
              the model's prediction and the stock's recent volatility.
            </div>
            <div>
              <strong className="text-slate-200">Top Signals View:</strong>{" "}
              Displays the highest-scoring tradeable setups, ranked by Quant
              Score. Only signals meeting minimum thresholds (score ≥35, edge{" "}
              {">"}5%) are shown, filtering out noise from the neutral-dominant
              predictions.
            </div>

            {/* Technical Details Subsection */}
            <details className="mt-4">
              <summary className="cursor-pointer text-slate-400 hover:text-teal-400 transition-colors text-xs">
                Model Details (Technical)
              </summary>
              <div className="mt-3 space-y-2 text-xs text-slate-400 pl-4 border-l-2 border-slate-700">
                <p>
                  <strong className="text-slate-300">Architecture:</strong>{" "}
                  LightGBM gradient boosting classifier with hybrid class
                  balancing
                </p>
                <p>
                  <strong className="text-slate-300">Features:</strong> 39+
                  technical indicators including lag features
                  (prev_close_return, prev_body, prev_range) for momentum
                  context
                </p>
                <p>
                  <strong className="text-slate-300">Labeling:</strong>{" "}
                  Two-threshold system with dominant neutral class
                </p>
                <p>
                  <strong className="text-slate-300">
                    Dynamic Thresholds:
                  </strong>{" "}
                  Volatility-aware bands (30-day window) adapt to market regimes
                </p>
                <p>
                  <strong className="text-slate-300">Training Data:</strong> Up
                  to 20 years of daily OHLCV data per symbol
                </p>
              </div>
            </details>
          </div>
        )}
      </Card>

      {/* Limitations */}
      <Card className="p-6 border border-amber-500/20">
        <button
          onClick={toggleLimitations}
          className="w-full flex items-center justify-between text-left mb-3 hover:text-amber-400 transition-colors"
        >
          <h3 className="text-lg font-bold text-amber-500">
            Important Limitations
          </h3>
          {showLimitations ? (
            <ChevronUp size={20} className="text-amber-500" />
          ) : (
            <ChevronDown size={20} className="text-amber-500" />
          )}
        </button>
        {showLimitations && (
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              • <strong>Daily Bar Only:</strong> Predictions are based on daily
              closing prices and does not capture intraday movements. A stock
              could have significant intraday volatility even if it closes near
              today's price.
            </li>
            <li>
              • <strong>Technical Analysis Only:</strong> Models use only price
              and volume data. They don't know about earnings reports, product
              launches, regulatory changes, or macroeconomic events that could
              move the stock.
            </li>
            <li>
              • <strong>Past ≠ Future:</strong> Models learn from historical
              patterns. If market dynamics change (regime shift, new
              regulations, unprecedented events), historical patterns may not
              hold.
            </li>
            <li>
              • <strong>Probability, Not Certainty:</strong> A 70% confidence
              prediction means there's still a 30% chance it goes the other way.
              Even high-confidence predictions can be wrong.
            </li>
            <li>
              • <strong>No Execution Modeling:</strong> These predictions don't
              account for slippage, spreads, transaction costs, or the
              difficulty of executing trades at specific prices.
            </li>
          </ul>
        )}
      </Card>
    </div>
  );
}

function TopSignalsView({ signals }: { signals: EnhancedSignal[] }) {
  const tradeableSignals = signals
    .filter((s) => s.isTradeable)
    .sort((a, b) => b.quantScore - a.quantScore)
    .slice(0, 10);

  const regimeCounts = signals.reduce((acc, s) => {
    acc[s.regime] = (acc[s.regime] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Top Signals List */}
      {tradeableSignals.length > 0 ? (
        <div className="space-y-3">
          {tradeableSignals.map((signal, idx) => (
            <div
              key={signal.ticker}
              className="p-5 hover:bg-slate-900/40 transition-all border-l-4 rounded-lg border border-slate-800 bg-slate-900/50"
              style={{
                borderLeftColor:
                  signal.quantScore >= 70
                    ? "#10b981"
                    : signal.quantScore >= 50
                    ? "#3b82f6"
                    : signal.quantScore >= 30
                    ? "#f59e0b"
                    : "#64748b",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-slate-500">
                      #{idx + 1}
                    </span>
                    <h3 className="text-xl font-bold text-slate-100">
                      {signal.ticker}
                    </h3>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        signal.quantScore >= 70
                          ? "bg-emerald-500/20 text-emerald-400"
                          : signal.quantScore >= 50
                          ? "bg-blue-500/20 text-blue-400"
                          : signal.quantScore >= 30
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      Score: {signal.quantScore}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">
                    {signal.signalDescription}
                  </p>
                  <p className="text-xs text-slate-400 italic mb-3">
                    {signal.tradingInterpretation}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Directional Edge</p>
                      <p
                        className={`text-sm font-semibold ${
                          signal.edgeDirectional > 0
                            ? "text-teal-400"
                            : "text-rose-400"
                        }`}
                      >
                        {(signal.edgeDirectional * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        Expected Directional Impact
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          signal.expectedReturn > 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {signal.expectedReturn > 0 ? "+" : ""}
                        {(signal.expectedReturn * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-slate-500">Current Price</p>
                  <p className="text-lg font-bold text-slate-100">
                    ${signal.current_price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-slate-400">
            No tradeable signals identified today.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Check back later or lower the score threshold.
          </p>
        </Card>
      )}
    </div>
  );
}

function EnhancedPredictionCard({ signal }: { signal: EnhancedSignal }) {
  const {
    ticker,
    current_price,
    quantScore,
    edge,
    edgeDirectional,
    regime,
    expectedReturn,
    prob1PctMove,
    prob2PctMove,
    signalDescription,
    tradingInterpretation,
    prob_up,
    prob_down,
    prob_neutral,
    confidence,
  } = signal;

  const scoreColor =
    quantScore >= 70
      ? "text-emerald-400"
      : quantScore >= 50
      ? "text-blue-400"
      : quantScore >= 30
      ? "text-amber-400"
      : "text-slate-400";

  const scoreBarColor =
    quantScore >= 70
      ? "bg-emerald-500"
      : quantScore >= 50
      ? "bg-blue-500"
      : quantScore >= 30
      ? "bg-amber-500"
      : "bg-slate-500";

  return (
    <Card className="p-5 hover:bg-slate-900/20 transition-all hover:border-slate-700">
      {/* Header with Quant Score */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">{ticker}</h3>
          <p className="text-sm text-slate-300">${current_price.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Quant Score
          </p>
          <p className={`text-3xl font-bold ${scoreColor}`}>{quantScore}</p>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full ${scoreBarColor} transition-all duration-300`}
            style={{ width: `${quantScore}%` }}
          />
        </div>
      </div>

      {/* Signal Description */}
      <div className="mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700">
        <p className="text-sm text-slate-300 mb-2">{signalDescription}</p>
        <p className="text-xs text-slate-400 italic">{tradingInterpretation}</p>
      </div>

      {/* Regime Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          {regime}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-slate-800/30">
          <p className="text-xs text-slate-500 mb-1">Directional Edge</p>
          <p
            className={`text-lg font-bold ${
              edgeDirectional > 0 ? "text-teal-400" : "text-rose-400"
            }`}
          >
            {(edgeDirectional * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/30">
          <p className="text-xs text-slate-500 mb-1">
            Expected Directional Impact
          </p>
          <p
            className={`text-lg font-bold ${
              expectedReturn > 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {expectedReturn > 0 ? "+" : ""}
            {(expectedReturn * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Probability Distribution */}
      <div className="mb-3">
        <p className="text-xs text-slate-500 mb-2">Probability Distribution:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-16">Higher:</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${prob_up * 100}%` }}
              />
            </div>
            <span className="text-xs text-emerald-400 font-semibold w-12 text-right">
              {(prob_up * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-16">Neutral:</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-slate-500"
                style={{ width: `${prob_neutral * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold w-12 text-right">
              {(prob_neutral * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-16">Lower:</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-rose-400"
                style={{ width: `${prob_down * 100}%` }}
              />
            </div>
            <span className="text-xs text-rose-400 font-semibold w-12 text-right">
              {(prob_down * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Footer */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Model Confidence:</span>
          <span
            className={`font-semibold ${
              confidence >= 0.85 ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const {
    ticker,
    current_price,
    signal,
    confidence,
    prob_up,
    prob_down,
    prob_neutral,
    should_trade,
    take_profit,
    stop_loss,
  } = prediction;

  const signalColor =
    signal === "BUY"
      ? "text-emerald-400"
      : signal === "SELL"
      ? "text-rose-400"
      : "text-slate-400";
  const SignalIcon =
    signal === "BUY" ? TrendingUp : signal === "SELL" ? TrendingDown : Minus;

  const biasLabel =
    signal === "BUY"
      ? "Bullish Bias"
      : signal === "SELL"
      ? "Bearish Bias"
      : "Mixed";

  // Generate summary text
  const getSummaryText = () => {
    if (signal === "BUY") {
      const strength =
        confidence >= 0.7 ? "Strong" : confidence >= 0.65 ? "Moderate" : "Mild";
      return `${strength}ly Bullish (${(prob_up * 100).toFixed(0)}% vs ${(
        prob_down * 100
      ).toFixed(0)}%)`;
    } else if (signal === "SELL") {
      const strength =
        confidence >= 0.7 ? "Strong" : confidence >= 0.65 ? "Moderate" : "Mild";
      return `${strength}ly Bearish (${(prob_down * 100).toFixed(0)}% vs ${(
        prob_up * 100
      ).toFixed(0)}%)`;
    } else {
      return `Mixed outlook (${(Math.max(prob_up, prob_down) * 100).toFixed(
        0
      )}% max)`;
    }
  };

  return (
    <Card className="p-5 hover:bg-slate-900/20 transition-all hover:border-slate-700">
      {/* Enhanced Summary Line */}
      <div className="mb-3 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Model view: <span className={signalColor}>{getSummaryText()}</span>
          </p>
          {confidence >= 0.85 && (
            <div className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              HIGH CONF
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">{ticker}</h3>
          <p className="text-xs text-slate-500">Current</p>
          <p className="text-sm text-slate-300 font-semibold">
            ${current_price.toFixed(2)}
          </p>
        </div>
        <div
          className={`px-2.5 py-1 rounded-md bg-slate-800/50 border ${
            signal === "BUY"
              ? "border-emerald-500/30"
              : signal === "SELL"
              ? "border-rose-500/30"
              : "border-slate-600/30"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <SignalIcon size={14} className={signalColor} />
            <span className={`font-medium text-xs ${signalColor}`}>
              {biasLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Probability Breakdown */}
      <div className="mb-3">
        <div className="text-xs text-slate-500 mb-2">
          Tomorrow's Close vs Today (3-Class Model):
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Prob. Higher:</span>
            <span className="font-semibold text-emerald-400">
              {(prob_up * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Prob. Neutral:</span>
            <span className="font-semibold text-slate-400">
              {(prob_neutral * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Prob. Lower:</span>
            <span className="font-semibold text-rose-400">
              {(prob_down * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Visual Probability Bar */}
      <div className="h-2 rounded-full overflow-hidden bg-slate-800 mb-4 flex">
        <div
          className="bg-emerald-400"
          style={{ width: `${prob_up * 100}%` }}
        />
        <div
          className="bg-slate-600"
          style={{ width: `${prob_neutral * 100}%` }}
        />
        <div className="bg-rose-400" style={{ width: `${prob_down * 100}%` }} />
      </div>

      {/* Model Confidence */}
      <div className="mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-400">Confidence:</span>
          <span
            className={`font-semibold ${
              confidence >= 0.65 ? "text-teal-400" : "text-slate-400"
            }`}
          >
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="text-xs text-slate-500">
          {confidence >= 0.65
            ? "High conviction - model is relatively certain"
            : "Lower certainty - model is less confident"}
        </div>
      </div>

      {/* Hypothetical Targets */}
      {take_profit && stop_loss && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Hypothetical TP:</span>
            <span className="text-emerald-400">${take_profit.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Hypothetical SL:</span>
            <span className="text-rose-400">${stop_loss.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Enhanced High Conviction Indicator */}
      {should_trade && (
        <div className="mt-4 px-3 py-2.5 rounded-md bg-linear-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/30">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            <div className="text-xs text-teal-400 font-bold uppercase tracking-wide">
              High Conviction Trade Signal
            </div>
          </div>
          <div className="text-xs text-teal-400/80 mt-1">
            ✓ Confidence ≥64% (SYSTEM_SPEC threshold)
          </div>
          <div className="text-xs text-teal-400/80">
            ✓ Directional bias (non-neutral)
          </div>
        </div>
      )}

      {/* Model Info Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Model:</span>
          <span className="text-emerald-400 font-mono">LGBMv2 (Optimized)</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-slate-500">Features:</span>
          <span className="text-slate-400">39+ indicators + lag context</span>
        </div>
      </div>
    </Card>
  );
}

function ForecastCard({ forecast }: { forecast: DistributionalForecast }) {
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
        <p className="text-xs text-slate-500 mt-3 text-center">
          80% chance price falls within this range
        </p>
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
