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
  atr: number | null;
};

type Props = {
  symbols: string[];
  watchlistName?: string;
};

export function QuantLabClient({ symbols, watchlistName }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
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
      const res = await fetch("/api/quant/predictions");
      if (res.ok) {
        const data = await res.json();
        // Filter predictions to only show watchlist symbols
        const allPredictions = data.predictions || [];
        const filtered = allPredictions.filter((p: Prediction) =>
          symbols.includes(p.ticker)
        );
        setPredictions(filtered);
      } else {
        setError("Failed to load predictions");
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
      setError("Failed to load predictions");
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
        <h1 className="text-2xl font-bold text-slate-100">
          Daily Price Movement Predictions{" "}
          {watchlistName && (
            <span className="text-slate-400">- {watchlistName}</span>
          )}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Next-day price direction forecasts based on daily bar technical
          analysis
        </p>
      </div>

      {/* Summary Banner */}
      <Card className="p-4 bg-slate-900/40 border-slate-800">
        <p className="text-sm text-slate-300">
          Today,{" "}
          <span className="font-semibold text-teal-400">
            {bullishCount}/{totalCount}
          </span>{" "}
          of your tracked stocks have a{" "}
          <span className="text-emerald-400">bullish</span> model bias for
          tomorrow
          {bearishCount > 0 && (
            <>
              ,{" "}
              <span className="font-semibold text-rose-400">
                {bearishCount}
              </span>{" "}
              {bearishCount === 1 ? "has" : "have"} a{" "}
              <span className="text-rose-400">bearish</span> bias
            </>
          )}
          {neutralCount > 0 && (
            <>
              , and{" "}
              <span className="font-semibold text-slate-400">
                {neutralCount}
              </span>{" "}
              {neutralCount === 1 ? "is" : "are"}{" "}
              <span className="text-slate-400">neutral</span>
            </>
          )}
          .
        </p>
      </Card>

      {/* Prediction Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {predictions.map((pred) => (
          <PredictionCard key={pred.ticker} prediction={pred} />
        ))}
      </div>

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
              <strong className="text-slate-200">Timeframe:</strong> Uses daily
              (1-day) bars to predict the next trading day's price direction.
              Each prediction forecasts whether the stock will close higher,
              lower, or flat compared to today.
            </div>
            <div>
              <strong className="text-slate-200">Model:</strong> Machine
              learning classifier trained on up to 20 years of daily price data
              using technical indicators like momentum, volatility, volume
              patterns, and moving averages.
            </div>
            <div>
              <strong className="text-slate-200">Training:</strong> Each stock
              has its own model trained on historical patterns specific to that
              symbol. Models are retrained as new data becomes available.
            </div>
            <div>
              <strong className="text-slate-200">Confidence Score:</strong> The
              model outputs probabilities for each outcome
              (Higher/Lower/Neutral). The confidence score represents the
              model's certainty in its prediction. For example, 65% confidence
              means the model assigns 65% probability to the predicted direction
              and 35% to other outcomes.
            </div>
            <div>
              <strong className="text-slate-200">Model Bias:</strong> Bullish =
              expects price to close higher tomorrow | Bearish = expects price
              to close lower tomorrow. The higher the confidence, the stronger
              the model's conviction.
            </div>

            {/* Technical Details Subsection */}
            <details className="mt-4">
              <summary className="cursor-pointer text-slate-400 hover:text-teal-400 transition-colors text-xs">
                Model Details (Technical)
              </summary>
              <div className="mt-3 space-y-2 text-xs text-slate-400 pl-4 border-l-2 border-slate-700">
                <p>
                  <strong className="text-slate-300">Architecture:</strong>{" "}
                  LightGBM gradient boosting classifier
                </p>
                <p>
                  <strong className="text-slate-300">Features:</strong> 45+
                  technical indicators including momentum (RSI, MACD,
                  Stochastic), volatility (ATR, Bollinger Bands), volume
                  patterns, and moving averages
                </p>
                <p>
                  <strong className="text-slate-300">Training Data:</strong> 20
                  years of daily OHLCV data per symbol
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
      return `${strength}ly Bullish for tomorrow (${(prob_up * 100).toFixed(
        0
      )}% vs ${(prob_down * 100).toFixed(0)}%)`;
    } else if (signal === "SELL") {
      const strength =
        confidence >= 0.7 ? "Strong" : confidence >= 0.65 ? "Moderate" : "Mild";
      return `${strength}ly Bearish for tomorrow (${(prob_down * 100).toFixed(
        0
      )}% vs ${(prob_up * 100).toFixed(0)}%)`;
    } else {
      return `Mixed outlook for tomorrow (${(
        Math.max(prob_up, prob_down) * 100
      ).toFixed(0)}% max)`;
    }
  };

  return (
    <Card className="p-5 hover:bg-slate-900/20 transition-all">
      {/* Summary Line */}
      <div className="mb-3 pb-3 border-b border-slate-800">
        <p className="text-xs text-slate-400">
          Model view: <span className={signalColor}>{getSummaryText()}</span>
        </p>
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

      {/* Probability Breakdown */}
      <div className="mb-3">
        <div className="text-xs text-slate-500 mb-2">
          Tomorrow's Close vs Today:
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Prob. Higher:</span>
            <span className="font-semibold text-emerald-400">
              {(prob_up * 100).toFixed(1)}%
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

      {/* High Conviction Indicator */}
      {should_trade && (
        <div className="mt-4 px-3 py-2 rounded-md bg-teal-500/10 border border-teal-500/30">
          <div className="text-xs text-teal-400 font-semibold">
            High Model Conviction
          </div>
          <div className="text-xs text-teal-400/70 mt-0.5">
            ≥65% probability
          </div>
        </div>
      )}
    </Card>
  );
}
