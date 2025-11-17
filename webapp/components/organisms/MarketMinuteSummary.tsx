"use client";

import { useEffect, useState } from "react";
import Card from "@/components/atoms/card";

type TickerPerformance = {
  symbol: string;
  changePct: number;
};

type SummaryData = {
  headline: string;
  body: string;
  stats: {
    listName: string;
    totalSymbols: number;
    upCount: number;
    downCount: number;
    best: { symbol: string; changePct: number } | null;
    worst: { symbol: string; changePct: number } | null;
  };
  tickerPerformance?: TickerPerformance[];
};

type Props = {
  watchlistId: string | null;
};

// Common ticker to company name mappings
const TICKER_TO_COMPANY: Record<string, string[]> = {
  AAPL: ["Apple"],
  MSFT: ["Microsoft"],
  GOOGL: ["Google", "Alphabet"],
  GOOG: ["Google", "Alphabet"],
  AMZN: ["Amazon"],
  NVDA: ["Nvidia"],
  TSLA: ["Tesla"],
  META: ["Meta", "Facebook"],
  NFLX: ["Netflix"],
  AMD: ["AMD"],
  INTC: ["Intel"],
  ORCL: ["Oracle"],
  CRM: ["Salesforce"],
  ADBE: ["Adobe"],
  PYPL: ["PayPal"],
  DIS: ["Disney"],
  BA: ["Boeing"],
  GE: ["General Electric"],
  JPM: ["JPMorgan", "JP Morgan"],
  BAC: ["Bank of America"],
  WMT: ["Walmart"],
  V: ["Visa"],
  MA: ["Mastercard"],
  PFE: ["Pfizer"],
  JNJ: ["Johnson & Johnson"],
  KO: ["Coca-Cola", "Coca Cola"],
  PEP: ["PepsiCo", "Pepsi"],
  NKE: ["Nike"],
  MCD: ["McDonald's", "McDonalds"],
  SBUX: ["Starbucks"],
  T: ["AT&T"],
  VZ: ["Verizon"],
  CMCSA: ["Comcast"],
};

// Helper function to highlight tickers in text
function highlightTickers(
  text: string,
  tickerPerformance: TickerPerformance[]
): React.ReactNode[] {
  if (!tickerPerformance || tickerPerformance.length === 0) {
    return [<span key="text">{text}</span>];
  }

  // Create a map for quick lookup: symbol -> changePct
  const perfMap = new Map(
    tickerPerformance.map((t) => [t.symbol.toUpperCase(), t.changePct])
  );

  // Build patterns to match: both ticker symbols and company names
  const patterns: Array<{
    pattern: string;
    ticker: string;
    changePct: number;
  }> = [];

  for (const ticker of tickerPerformance) {
    const changePct = ticker.changePct;
    const symbol = ticker.symbol.toUpperCase();

    // Add the ticker symbol itself
    patterns.push({ pattern: symbol, ticker: symbol, changePct });

    // Add company names if available
    const companyNames = TICKER_TO_COMPANY[symbol];
    if (companyNames) {
      for (const name of companyNames) {
        patterns.push({ pattern: name, ticker: symbol, changePct });
      }
    }
  }

  // Sort by length (longest first) to match longer names before shorter ones
  patterns.sort((a, b) => b.pattern.length - a.pattern.length);

  // Build a regex that matches any of the patterns (case-insensitive)
  const patternStrings = patterns.map((p) =>
    p.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const combinedRegex = new RegExp(`\\b(${patternStrings.join("|")})\\b`, "gi");

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    const matchedText = match[0];
    const matchedUpper = matchedText.toUpperCase();

    // Find the matching pattern
    const matchingPattern = patterns.find(
      (p) => p.pattern.toUpperCase() === matchedUpper
    );

    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add the highlighted text
    if (matchingPattern) {
      const color =
        matchingPattern.changePct > 0
          ? "text-emerald-400"
          : matchingPattern.changePct < 0
          ? "text-rose-400"
          : "text-slate-300";
      parts.push(
        <span
          key={`ticker-${match.index}`}
          className={`font-semibold ${color}`}
        >
          {matchedText}
        </span>
      );
    } else {
      parts.push(<span key={`ticker-${match.index}`}>{matchedText}</span>);
    }

    lastIndex = match.index + matchedText.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts;
}

export function MarketMinuteSummary({ watchlistId }: Props) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!watchlistId) {
      setLoading(false);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);

    fetch(`/api/summary?watchlistId=${watchlistId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch summary");
        return res.json();
      })
      .then((data: SummaryData) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching summary:", err);
        setError("Unable to load summary");
        setLoading(false);
      });
  }, [watchlistId]);

  if (!watchlistId) {
    return null;
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500"></div>
            <p className="text-sm text-slate-400">
              Generating your MarketMinute...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-slate-400">{error || "Unable to load summary"}</p>
        </div>
      </Card>
    );
  }

  const highlightedBody = summary.tickerPerformance
    ? highlightTickers(summary.body, summary.tickerPerformance)
    : summary.body;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">
          {summary.headline}
        </h2>
        <span className="text-xs text-slate-500">MarketMinute</span>
      </div>

      {/* Stats Grid */}
      <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-800/50 p-4 md:grid-cols-4">
        <div>
          <div className="text-xs text-slate-400">Total Symbols</div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {summary.stats.totalSymbols}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Green</div>
          <div className="mt-1 text-lg font-semibold text-emerald-400">
            {summary.stats.upCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Red</div>
          <div className="mt-1 text-lg font-semibold text-rose-400">
            {summary.stats.downCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Best Performer</div>
          <div
            className={`mt-1 text-sm font-semibold ${
              summary.stats.best && summary.stats.best.changePct >= 0
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            {summary.stats.best
              ? `${summary.stats.best.symbol} (${
                  summary.stats.best.changePct >= 0 ? "+" : ""
                }${summary.stats.best.changePct.toFixed(2)}%)`
              : "N/A"}
          </div>
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {highlightedBody}
        </div>
      </div>
    </Card>
  );
}
