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

    // If it's already open, just close it
    if (hasExplanation) {
      setExplanations((prev) => {
        const next = { ...prev };
        delete next[s.symbol];
        return next;
      });
      return;
    }

    // Otherwise fetch explanation
    setLoadingSymbol(s.symbol);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: s.symbol, changePct: s.changePct }),
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
    <Card className="p-4 text-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        Today&apos;s Symbols
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        {snapshots.map((s) => {
          const hasExplanation = !!explanations[s.symbol];

          return (
            <div
              key={s.symbol}
              className="flex flex-col rounded-lg bg-slate-900/60 px-3 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-100">{s.symbol}</span>
                <span className="text-xs text-slate-400">
                  ${s.price.toFixed(2)}{" "}
                  <span
                    className={
                      s.changePct > 0
                        ? "text-emerald-400"
                        : s.changePct < 0
                        ? "text-rose-400"
                        : "text-slate-400"
                    }
                  >
                    ({s.changePct > 0 ? "+" : ""}
                    {s.changePct.toFixed(2)}%)
                  </span>
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-w-0 px-3 py-1 text-xs"
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
                <p className="mt-3 rounded bg-slate-800/50 p-2 text-xs leading-relaxed text-slate-300">
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
