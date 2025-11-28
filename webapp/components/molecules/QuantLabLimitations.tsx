"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import { ChevronDown, ChevronUp } from "lucide-react";

export function QuantLabLimitations() {
  const [showLimitations, setShowLimitations] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quantlab-limitations-visible");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const toggleLimitations = () => {
    const newValue = !showLimitations;
    setShowLimitations(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem("quantlab-limitations-visible", String(newValue));
    }
  };

  return (
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
            patterns. If market dynamics change (regime shift, new regulations,
            unprecedented events), historical patterns may not hold.
          </li>
          <li>
            • <strong>Probability, Not Certainty:</strong> A 70% confidence
            prediction means there's still a 30% chance it goes the other way.
            Even high-confidence predictions can be wrong.
          </li>
          <li>
            • <strong>No Execution Modeling:</strong> These predictions don't
            account for slippage, spreads, transaction costs, or the difficulty
            of executing trades at specific prices.
          </li>
        </ul>
      )}
    </Card>
  );
}
