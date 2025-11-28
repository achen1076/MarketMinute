"use client";

import { useEffect, useState, useRef } from "react";
import Card from "@/components/atoms/Card";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { TICKER_TO_COMPANY } from "@/lib/tickerMappings";

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

function highlightTickers(
  text: string,
  tickerPerformance: TickerPerformance[]
): React.ReactNode[] {
  if (!tickerPerformance || tickerPerformance.length === 0) {
    return [<span key="text">{text}</span>];
  }

  const perfMap = new Map(
    tickerPerformance.map((t) => [t.symbol.toUpperCase(), t.changePct])
  );

  const patterns: Array<{
    pattern: string;
    ticker: string;
    changePct: number;
  }> = [];

  for (const ticker of tickerPerformance) {
    const changePct = ticker.changePct;
    const symbol = ticker.symbol.toUpperCase();

    patterns.push({ pattern: symbol, ticker: symbol, changePct });

    const companyNames = TICKER_TO_COMPANY[symbol];
    if (companyNames) {
      for (const name of companyNames) {
        patterns.push({ pattern: name, ticker: symbol, changePct });
      }
    }
  }

  patterns.sort((a, b) => b.pattern.length - a.pattern.length);

  const patternStrings = patterns.map((p) =>
    p.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const combinedRegex = new RegExp(`\\b(${patternStrings.join("|")})\\b`, "g");

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    const matchedText = match[0];
    const matchedUpper = matchedText.toUpperCase();

    const matchingPattern = patterns.find(
      (p) => p.pattern.toUpperCase() === matchedUpper
    );
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

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

  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts;
}

export function MarketMinuteSummary({ watchlistId }: Props) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchSummary = async () => {
    if (!watchlistId) {
      setLoading(false);
      setSummary(null);
      return;
    }

    try {
      const res = await fetch(`/api/summary?watchlistId=${watchlistId}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      const data: SummaryData = await res.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching summary:", err);
      setError("Unable to load summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!watchlistId) {
      setLoading(false);
      setSummary(null);
      return;
    }

    setLoading(true);
    fetchSummary();

    // Poll every 5 seconds for live price updates
    const interval = setInterval(() => {
      fetchSummary();
    }, 5000);

    return () => clearInterval(interval);
  }, [watchlistId]);

  const handleTextToSpeech = async () => {
    if (!summary) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      setIsTTSLoading(true);

      const textToRead = `${summary.headline}. ${summary.body}`;

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToRead }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setError("Failed to play audio");
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS Error:", err);
      setError("Unable to play audio");
    } finally {
      setIsTTSLoading(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
        <div className="flex items-center gap-3">
          <button
            onClick={handleTextToSpeech}
            disabled={isTTSLoading}
            className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-slate-300 transition-all hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            title={isPlaying ? "Stop reading" : "Read summary aloud"}
          >
            {isTTSLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isPlaying ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} />
            )}
            <span className="hidden sm:inline">
              {isPlaying ? "Stop" : "Listen"}
            </span>
          </button>
          <span className="text-xs text-slate-500">MarketMinute</span>
        </div>
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
