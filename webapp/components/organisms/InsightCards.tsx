"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import {
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Activity,
  DollarSign,
  Shield,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface InsightCard {
  title: string;
  category:
    | "market"
    | "sector"
    | "volatility"
    | "macro"
    | "opportunity"
    | "risk";
  insight: string;
  dataPoints: string[];
  confidence: "high" | "medium" | "low";
}

interface InsightsResponse {
  ok: boolean;
  insights?: {
    cards: InsightCard[];
    timestamp: string;
  };
  error?: string;
}

const categoryConfig = {
  market: {
    icon: TrendingUp,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  sector: {
    icon: BarChart3,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  volatility: {
    icon: Activity,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  macro: {
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
  opportunity: {
    icon: Sparkles,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  risk: {
    icon: AlertTriangle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
};

const confidenceConfig = {
  high: { label: "High", color: "text-green-400" },
  medium: { label: "Med", color: "text-yellow-400" },
  low: { label: "Low", color: "text-slate-400" },
};

interface InsightCardsProps {
  reportContext?: any;
  autoLoad?: boolean;
}

export default function InsightCards({
  reportContext,
  autoLoad = false,
}: InsightCardsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadInsights() {
    if (!reportContext) {
      setError("No report context available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sentinel/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: reportContext }),
      });

      const data: InsightsResponse = await res.json();

      if (data.ok && data.insights) {
        setInsights(data.insights.cards);
      } else {
        setError(data.error || "Failed to load insights");
      }
    } catch (err) {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Market Insights
            </h3>
            <p className="text-sm text-slate-400">
              AI-generated actionable takeaways
            </p>
          </div>
        </div>
        {!insights && !loading && reportContext && (
          <button
            onClick={loadInsights}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Sparkles size={16} />
            Generate Insights
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm animate-pulse">
            Analyzing market data...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
          <p className="text-rose-200 text-sm">{error}</p>
        </div>
      )}

      {/* Insights Grid */}
      {insights && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((card, idx) => {
            const config = categoryConfig[card.category];
            const Icon = config.icon;
            const confidenceInfo = confidenceConfig[card.confidence];

            return (
              <Card
                key={idx}
                className={`${config.bg} border ${config.border} hover:border-opacity-60 transition-all duration-200 group cursor-pointer`}
              >
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${config.bg} ${config.border} border`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-slate-100 font-semibold text-sm leading-tight group-hover:text-white transition-colors">
                          {card.title}
                        </h4>
                        <span className={`text-xs ${config.color} capitalize`}>
                          {card.category}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${confidenceInfo.color} bg-slate-800/50 border border-slate-700`}
                    >
                      {confidenceInfo.label}
                    </div>
                  </div>

                  {/* Insight */}
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {card.insight}
                  </p>

                  {/* Data Points */}
                  {card.dataPoints.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-700/50">
                      {card.dataPoints.map((point, pointIdx) => (
                        <div
                          key={pointIdx}
                          className="flex items-center gap-2 text-xs text-slate-400"
                        >
                          <ChevronRight size={12} className={config.color} />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!insights && !loading && !error && reportContext && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Click "Generate Insights" to get AI-powered market analysis
        </div>
      )}

      {/* No Context State */}
      {!reportContext && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Generate a Sentinel report first to unlock insights
        </div>
      )}
    </div>
  );
}
