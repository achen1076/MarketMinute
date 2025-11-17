"use client";

import { useState } from "react";
import type { TickerSnapshot } from "@/lib/marketData";
import Card from "@/components/atoms/card";
import Button from "@/components/atoms/button";

type Props = {
  snapshots: TickerSnapshot[];
};

export function TickerListClient({ snapshots }: Props) {
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  async function handleExplainToggle(s: TickerSnapshot) {
    const hasExplanation = !!explanations[s.symbol];

    if (hasExplanation) {
      setExplanations((prev) => {
        const next = { ...prev };
        delete next[s.symbol];
        return next;
      });
      return;
    }

    setLoadingSymbol(s.symbol);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: s.symbol,
          changePct: s.changePct,
          price: s.price, // NEW: give LLM more context
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setExplanations((prev) => ({
        ...prev,
        [s.symbol]: data.explanation as string,
      }));
    } finally {
      setLoadingSymbol(null);
    }
  }

  return (
    <Card className="p-4 text-sm h-full overflow-hidden flex flex-col">
      <h3 className="mb-3 text-sm font-semibold text-slate-200 shrink-0">
        Your Symbols
      </h3>
      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
        {snapshots.map((s) => {
          const hasExplanation = !!explanations[s.symbol];

          return (
            <div
              key={s.symbol}
              className="flex flex-col rounded-lg bg-slate-900/60 px-3 py-3 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-100 mb-1">
                    {s.symbol}
                  </div>
                  <div className="text-md text-slate-200">
                    ${s.price.toFixed(2)}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold shrink-0 ${
                    s.changePct > 0
                      ? "text-emerald-400"
                      : s.changePct < 0
                      ? "text-rose-400"
                      : "text-slate-400"
                  }`}
                >
                  {s.changePct > 0 ? "+" : ""}
                  {s.changePct.toFixed(2)}%
                </div>
              </div>

              <div className="mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-1/3 px-3 py-1 text-xs"
                  onClick={() => handleExplainToggle(s)}
                  disabled={loadingSymbol === s.symbol}
                >
                  {loadingSymbol === s.symbol
                    ? "Explaining..."
                    : hasExplanation
                    ? "Close"
                    : "Explain move"}
                </Button>
              </div>

              {hasExplanation && (
                <p className="mt-3 rounded bg-slate-800/50 p-2 text-sm leading-relaxed text-slate-300">
                  {explanations[s.symbol]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
