"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Loader2,
  Library as LibraryIcon,
} from "lucide-react";
import { AnalysisCard } from "@/components/AnalysisCard";
import type { ExpectationGapAnalysis } from "@/lib/types";

interface StoredCard {
  id: string;
  ticker: string;
  analysisId: string;
  changePct: number;
  currentPrice: number;
  previousClose: number;
  volumeRatio: number;
  classification: string;
  confidence: string;
  narrative: ExpectationGapAnalysis["narrative"];
  secondOrder: ExpectationGapAnalysis["secondOrder"];
  gap: ExpectationGapAnalysis["gap"];
  baseline: ExpectationGapAnalysis["baseline"];
  createdAt: string;
}

function groupCardsByDate(cards: StoredCard[]): Record<string, StoredCard[]> {
  const groups: Record<string, StoredCard[]> = {};

  cards.forEach((card) => {
    const date = new Date(card.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(card);
  });

  return groups;
}

function cardToAnalysis(card: StoredCard): ExpectationGapAnalysis {
  return {
    symbol: card.ticker,
    trigger: "manual",
    priceMove: {
      symbol: card.ticker,
      currentPrice: card.currentPrice,
      previousClose: card.previousClose,
      change: card.currentPrice - card.previousClose,
      changePct: card.changePct,
      volume: 0,
      avgVolume: 0,
      volumeRatio: card.volumeRatio,
      timestamp: card.createdAt,
      intradayHigh: card.currentPrice,
      intradayLow: card.previousClose,
      intradayRange: 0,
    },
    baseline: card.baseline,
    gap: card.gap,
    secondOrder: card.secondOrder,
    narrative: card.narrative,
    analysisId: card.analysisId,
    createdAt: card.createdAt,
  };
}

export default function LibraryPage() {
  const [cards, setCards] = useState<StoredCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickerFilter, setTickerFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchCards = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (tickerFilter) params.set("ticker", tickerFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/cards?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please sign in to view your card library");
          setCards([]);
          return;
        }
        throw new Error("Failed to fetch cards");
      }

      const data = await res.json();
      setCards(data.cards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCards();
  };

  const groupedCards = groupCardsByDate(cards);
  const dateKeys = Object.keys(groupedCards);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          EGE Card Library
        </h1>
        <p className="text-muted-foreground">
          Your saved analysis cards, grouped by date
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-4 p-4 rounded-xl bg-card border border-border"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Ticker
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={tickerFilter}
              onChange={(e) => setTickerFilter(e.target.value.toUpperCase())}
              placeholder="Search by ticker..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Start Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs text-muted-foreground mb-1">
            End Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-medium text-sm transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12">
          <LibraryIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No cards found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Analyze a ticker to create your first card
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <h2 className="text-lg font-semibold text-foreground mb-4 sticky top-0 bg-background py-2">
                {dateKey}
                <span className="ml-2 text-sm text-muted-foreground font-normal">
                  ({groupedCards[dateKey].length} card
                  {groupedCards[dateKey].length !== 1 ? "s" : ""})
                </span>
              </h2>
              <div className="space-y-4">
                {groupedCards[dateKey].map((card) => (
                  <AnalysisCard key={card.id} analysis={cardToAnalysis(card)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
