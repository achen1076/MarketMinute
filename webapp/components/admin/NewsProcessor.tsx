"use client";

import { useState } from "react";

interface ProcessResult {
  id: string;
  ticker: string;
  headline: string;
  sentiment: number;
  sentimentCategory: string;
  relevance: number;
  relevanceCategory: string;
  createdAt: string;
}

export default function NewsProcessor() {
  const [headline, setHeadline] = useState("");
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!headline.trim() || !ticker.trim()) {
      setError("Both headline and ticker are required");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/news/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, ticker: ticker.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process news");
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setHeadline("");
    setTicker("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        News Processor Test
      </h2>
      <p className="text-muted-foreground mb-6">
        Test sentiment and relevance models by processing a news headline
      </p>

      <div className="space-y-4">
        {/* Ticker Input */}
        <div>
          <label
            htmlFor="ticker"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Ticker Symbol
          </label>
          <input
            id="ticker"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
        </div>

        {/* Headline Input */}
        <div>
          <label
            htmlFor="headline"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            News Headline
          </label>
          <textarea
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Enter a news headline..."
            rows={3}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleProcess}
            disabled={loading || !headline.trim() || !ticker.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Process News"}
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 disabled:bg-muted/50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="mt-6 p-6 bg-muted rounded-lg border border-border space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Processing Results
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                ID: {result.id}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sentiment Results */}
              <div className="p-4 bg-card rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Sentiment Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Score:</span>
                    <span
                      className={`font-bold ${
                        result.sentiment > 0.3
                          ? "text-green-400"
                          : result.sentiment < -0.3
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {result.sentiment.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Category:</span>
                    <span className="text-blue-400 font-medium">
                      {result.sentimentCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Relevance Results */}
              <div className="p-4 bg-card rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Relevance Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Score:</span>
                    <span
                      className={`font-bold ${
                        result.relevance > 0.7
                          ? "text-green-400"
                          : result.relevance > 0.4
                          ? "text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {result.relevance.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Category:</span>
                    <span className="text-purple-400 font-medium">
                      {result.relevanceCategory}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Headline and Ticker Display */}
            <div className="pt-4 border-t border-border">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Ticker:{" "}
                  </span>
                  <span className="text-foreground font-medium">
                    {result.ticker}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Headline:{" "}
                  </span>
                  <span className="text-foreground">{result.headline}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Processed:{" "}
                  </span>
                  <span className="text-foreground/80 text-sm">
                    {new Date(result.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Info */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Endpoint Parameters
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground font-mono">
          <div>
            <span className="text-blue-400">Sentiment:</span> POST /score{" "}
            {`{"text": "string"}`}
          </div>
          <div>
            <span className="text-purple-400">Relevance:</span> POST /score{" "}
            {`{"headline": "string", "ticker": "string"}`}
          </div>
        </div>
      </div>
    </div>
  );
}
