"use client";

import { useState, useRef, useEffect } from "react";
import { useUserPreferences } from "@/lib/user-preferences-context";
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
  generatedAt: string;
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
          ? "text-market-up"
          : matchingPattern.changePct < 0
          ? "text-market-down"
          : "text-market-neutral";
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
  const { preferences } = useUserPreferences();
  const tickerColoringEnabled = preferences.tickerColoring;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!watchlistId) {
      setLoading(false);
      setSummary(null);
      return;
    }

    // Abort any pending request for a different watchlist
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const currentWatchlistId = watchlistId;

    setLoading(true);
    setSummary(null);

    const fetchSummary = async () => {
      try {
        const res = await fetch(
          `/api/summary?watchlistId=${currentWatchlistId}`,
          {
            signal: abortController.signal,
          }
        );
        if (!res.ok) throw new Error("Failed to fetch summary");
        const data: SummaryData = await res.json();

        // Only update state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setSummary(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        // Ignore abort errors - they're expected when switching watchlists
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Error fetching summary:", err);
        if (!abortController.signal.aborted) {
          setError("Unable to load summary");
          setLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      abortController.abort();
    };
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
            <p className="text-sm text-muted-foreground">
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
          <p className="text-muted-foreground">
            {error || "Unable to load summary"}
          </p>
        </div>
      </Card>
    );
  }

  const highlightedBody =
    tickerColoringEnabled && summary.tickerPerformance
      ? highlightTickers(summary.body, summary.tickerPerformance)
      : summary.body;

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {summary.headline}
        </h2>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">MarketMinute</span>
          <span className="text-[10px] text-muted-foreground/70">
            {formatTimestamp(summary.generatedAt)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4 md:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Total Symbols</div>
          <div className="mt-1 text-lg font-semibold text-foreground">
            {summary.stats.totalSymbols}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Up</div>
          <div className="mt-1 text-lg font-semibold text-emerald-400">
            {summary.stats.upCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Down</div>
          <div className="mt-1 text-lg font-semibold text-rose-400">
            {summary.stats.downCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Best Performer</div>
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

      <div className="prose prose-invert dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {highlightedBody}
        </div>
      </div>
    </Card>
  );
}
