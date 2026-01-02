"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Brain,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

interface SentinelReport {
  summary: string;
  keyDrivers: string[];
  macroContext: string | null;
}

interface SentinelResponse {
  ok: boolean;
  report: SentinelReport;
  reportId: string;
  timestamp: string;
}

export default function SentinelExplainToday() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SentinelReport | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  async function explainToday() {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/sentinel/preview", {
        method: "POST",
      });

      const data: SentinelResponse = await res.json();

      if (data.ok) {
        setReport(data.report);
        setReportId(data.reportId);
      } else {
        setError("Failed to generate market explanation");
      }
    } catch (err) {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-linear-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/30">
      {/* Collapsible Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-indigo-500/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20">
            <Brain className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Sentinel</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground rounded">
                Preview
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI Market Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sentinel"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            Dashboard
            <ExternalLink size={14} />
          </Link>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-6 pt-0 border-t border-indigo-500/20">
          {/* Call to Action */}
          {!report && !loading && (
            <div className="space-y-4">
              <p className="text-foreground/80 mt-4">
                Get a quick AI-powered snapshot of today&apos;s market moves.
                This preview won&apos;t be saved to your dashboard history.
              </p>
              <button
                onClick={explainToday}
                disabled={loading}
                className="w-full px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles size={18} />
                Generate Preview
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <p className="text-muted-foreground animate-pulse">
                Analyzing market data...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-rose-200 font-medium">Error</p>
                <p className="text-rose-300/80 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Report Display */}
          {report && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 mt-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-400" />
                  Market Summary
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  {report.summary}
                </p>
              </div>

              {/* Key Drivers */}
              {report.keyDrivers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Key Drivers
                  </h3>
                  <ul className="space-y-2">
                    {report.keyDrivers.map((driver, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-foreground/80"
                      >
                        <span className="text-indigo-400 font-bold mt-0.5">
                          •
                        </span>
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Macro Context */}
              {report.macroContext && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Macro Context
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
                    {report.macroContext}
                  </p>
                </div>
              )}

              {/* Run Again Button */}
              <button
                onClick={explainToday}
                disabled={loading}
                className="w-full px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Refresh Preview
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
