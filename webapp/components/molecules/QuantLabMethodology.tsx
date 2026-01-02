"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import { ChevronDown, ChevronUp } from "lucide-react";

export function QuantLabMethodology() {
  const [showMethodology, setShowMethodology] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quantlab-methodology-visible");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const toggleMethodology = () => {
    const newValue = !showMethodology;
    setShowMethodology(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem("quantlab-methodology-visible", String(newValue));
    }
  };

  return (
    <Card className="p-6">
      <button
        onClick={toggleMethodology}
        className="w-full flex items-center justify-between text-left mb-3 hover:text-teal-400 transition-colors"
      >
        <h3 className="text-lg font-bold text-foreground">How It Works</h3>
        {showMethodology ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {showMethodology && (
        <div className="space-y-3 text-sm text-foreground/80">
          <div>
            <strong className="text-foreground">Signal Processing:</strong> Our
            signal engine transforms neutral-dominant predictions into
            actionable insights. Each stock receives a Quant Score (0-100) based
            on edge, confidence, and regime characteristics.
          </div>
          <div>
            <strong className="text-foreground">Quant Score:</strong> A single
            number combining multiple factors: directional edge (difference
            between up/down probabilities), model confidence, and expected
            volatility.
          </div>
          <div>
            <strong className="text-foreground">Regime Classification:</strong>{" "}
            Each stock is classified into regimes: trending (strong directional
            edge), high-vol breakout (large moves expected), low-vol chop
            (neutral-dominated), reverting (mean-reversion), or mixed.
          </div>
          <div>
            <strong className="text-foreground">
              Expected Directional Impact:
            </strong>{" "}
            Calculated as directional bias × volatility, this metric estimates
            the potential magnitude and direction of price movement based on the
            model's prediction and the stock's recent volatility.
          </div>
          <div>
            <strong className="text-foreground">
              Confidence Interpretation:
            </strong>{" "}
            Model confidence represents how certain the model is about its
            prediction. High confidence in a NEUTRAL prediction means the model
            is very sure there will be no significant move (not a trading
            opportunity). High confidence in a BUY/SELL signal indicates strong
            conviction in a directional move.
          </div>
          <div>
            <strong className="text-foreground">Top Signals View:</strong>{" "}
            Displays the highest-scoring tradeable setups, ranked by Quant
            Score. Only signals meeting minimum thresholds (score ≥35, edge{" "}
            {">"}5%) are shown, filtering out noise from the neutral-dominant
            predictions.
          </div>

          {/* Model Quality Details */}
          <details className="mt-4">
            <summary className="cursor-pointer text-muted-foreground hover:text-teal-400 transition-colors text-xs">
              Model Quality Metrics
            </summary>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground pl-4 border-l-2 border-border">
              <p>
                <strong className="text-foreground">Quality Tiers:</strong> Each
                model is rated based on backtested performance metrics.
              </p>
              <div className="mt-2 space-y-1">
                <p>
                  <span className="text-emerald-400">Best:</span> Sharpe Ratio
                  &gt;5, Profit Factor &gt;3 — Top performing models
                </p>
                <p>
                  <span className="text-blue-400">Excellent:</span> Sharpe Ratio
                  &gt;1, Profit Factor &gt;1.5 — Profitable models
                </p>
                <p>
                  <span className="text-amber-400">Good:</span> Profit Factor
                  1.0-1.5 — Break-even to modest performance
                </p>
                <p>
                  <span className="text-rose-400">Low Quality:</span> Profit
                  Factor &lt;1.0 — Historically underperforming
                </p>
              </div>
              <p className="mt-2">
                <strong className="text-foreground">Sharpe Ratio:</strong>{" "}
                Risk-adjusted return metric. Higher is better. Values above 1.0
                indicate returns exceed the risk taken.
              </p>
              <p>
                <strong className="text-foreground">Profit Factor:</strong>{" "}
                Gross profits ÷ gross losses. Above 1.0 means profitable
                overall. A value of 2.0 means $2 gained for every $1 lost.
              </p>
              <p className="italic mt-2">
                Quality ratings are updated each time models are retrained.
                Performance can change as market conditions evolve.
              </p>
            </div>
          </details>

          {/* Technical Details Subsection */}
          <details className="mt-4">
            <summary className="cursor-pointer text-muted-foreground hover:text-teal-400 transition-colors text-xs">
              Model Architecture (Technical)
            </summary>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground pl-4 border-l-2 border-border">
              <p>
                <strong className="text-foreground">Architecture:</strong>{" "}
                LightGBM gradient boosting with return prediction
              </p>
              <p>
                <strong className="text-foreground">Features:</strong> 36+
                technical indicators including regime detection, momentum, and
                volatility features
              </p>
              <p>
                <strong className="text-foreground">Prediction:</strong>{" "}
                Return-based regression model with directional thresholding
              </p>
              <p>
                <strong className="text-foreground">Training Data:</strong> Up
                to 20 years of daily OHLCV data per symbol
              </p>
            </div>
          </details>
        </div>
      )}
    </Card>
  );
}
