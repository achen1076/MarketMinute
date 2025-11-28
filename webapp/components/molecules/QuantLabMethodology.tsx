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
        <h3 className="text-lg font-bold text-slate-200">How It Works</h3>
        {showMethodology ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {showMethodology && (
        <div className="space-y-3 text-sm text-slate-300">
          <div>
            <strong className="text-slate-200">Signal Processing:</strong> Our
            signal engine transforms neutral-dominant predictions into
            actionable insights. Each stock receives a Quant Score (0-100) based
            on edge, confidence, and regime characteristics.
          </div>
          <div>
            <strong className="text-slate-200">Quant Score:</strong> A single
            number combining multiple factors: directional edge (difference
            between up/down probabilities), model confidence, and expected
            volatility.
          </div>
          <div>
            <strong className="text-slate-200">Regime Classification:</strong>{" "}
            Each stock is classified into regimes: trending (strong directional
            edge), high-vol breakout (large moves expected), low-vol chop
            (neutral-dominated), reverting (mean-reversion), or mixed.
          </div>
          <div>
            <strong className="text-slate-200">
              Expected Directional Impact:
            </strong>{" "}
            Calculated as directional bias × volatility, this metric estimates
            the potential magnitude and direction of price movement based on the
            model's prediction and the stock's recent volatility.
          </div>
          <div>
            <strong className="text-slate-200">
              Confidence Interpretation:
            </strong>{" "}
            Model confidence represents how certain the model is about its
            prediction. High confidence in a NEUTRAL prediction means the model
            is very sure there will be no significant move (not a trading
            opportunity). High confidence in a BUY/SELL signal indicates strong
            conviction in a directional move.
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
                technical indicators including lag features (prev_close_return,
                prev_body, prev_range) for momentum context
              </p>
              <p>
                <strong className="text-slate-300">Labeling:</strong>{" "}
                Two-threshold system with dominant neutral class
              </p>
              <p>
                <strong className="text-slate-300">Dynamic Thresholds:</strong>{" "}
                Volatility-aware bands (30-day window) adapt to market regimes
              </p>
              <p>
                <strong className="text-slate-300">Training Data:</strong> Up to
                20 years of daily OHLCV data per symbol
              </p>
            </div>
          </details>
        </div>
      )}
    </Card>
  );
}
