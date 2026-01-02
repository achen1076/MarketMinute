"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import { Sparkles, Loader2, TrendingUp, AlertCircle } from "lucide-react";

interface StructuredInsight {
  theme: string;
  observation: string;
  evidence: string[];
  interpretation: string;
  risk: string;
  probability: string;
}

export default function ProfessionalInsights({
  reportContext,
}: {
  reportContext?: any;
}) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<StructuredInsight[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate structured insights from keyDrivers
  const generateStructuredInsights = (report: any): StructuredInsight[] => {
    const structuredInsights: StructuredInsight[] = [];

    if (
      report.sectorRotation &&
      report.keyDrivers &&
      report.keyDrivers.length > 0
    ) {
      structuredInsights.push({
        theme: "Sector Rotation",
        observation: report.keyDrivers[0] || "Sector leadership shift detected",
        evidence: [
          report.keyDrivers[1] || "Multiple sectors showing divergence",
          `VIX ${
            report.vixChangePct && report.vixChangePct < 0
              ? "declining"
              : "rising"
          } ${
            report.vixChangePct ? Math.abs(report.vixChangePct).toFixed(1) : "0"
          }%`,
        ],
        interpretation:
          "Rotation into cyclicals suggests improving risk appetite",
        risk:
          report.vix && report.vix > 20
            ? "Elevated volatility may reverse rotation"
            : "Tech lag may deepen if yields rise",
        probability: "",
      });
    }

    if (report.volSpike) {
      structuredInsights.push({
        theme: "Volatility Event",
        observation: `VIX ${
          report.vixChangePct && report.vixChangePct > 0 ? "spiked" : "dropped"
        } ${
          report.vixChangePct ? Math.abs(report.vixChangePct).toFixed(1) : "0"
        }%`,
        evidence: [
          `Current VIX: ${report.vix?.toFixed(2) || "N/A"}`,
          `Realized Vol: ${report.realizedVol?.toFixed(1) || "N/A"}%`,
        ],
        interpretation:
          report.vixChangePct && report.vixChangePct > 0
            ? "Rising fear premium indicates defensive positioning"
            : "Declining volatility signals market complacency",
        risk:
          report.vixChangePct && report.vixChangePct < 0
            ? "Complacency risk if unexpected event occurs"
            : "Extended elevated vol may pressure equity valuations",
        probability: "",
      });
    }

    if (report.indexMove) {
      structuredInsights.push({
        theme: "Directional Move",
        observation: "Significant index movement detected",
        evidence: [
          report.keyDrivers && report.keyDrivers.length > 2
            ? report.keyDrivers[2]
            : "Broad market participation",
          "Volume profile elevated",
        ],
        interpretation: "Momentum building in primary indices",
        risk: "Overextension risk if move accelerates without pause",
        probability: "",
      });
    }

    return structuredInsights.length > 0 ? structuredInsights : [];
  };

  const structuredInsights = reportContext
    ? generateStructuredInsights(reportContext)
    : [];

  if (!reportContext) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Structured Insights
        </h3>
      </div>

      {structuredInsights.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-xs">
          No significant market signals detected
        </div>
      ) : (
        <div className="space-y-3">
          {structuredInsights.map((insight, idx) => (
            <Card key={idx} className="bg-muted/30 border-border">
              <div className="p-3">
                {/* Theme */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-indigo-400">
                    {insight.theme}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {insight.probability}
                  </span>
                </div>

                {/* Observation */}
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Observation
                  </span>
                  <p className="text-sm text-foreground mt-0.5">
                    {insight.observation}
                  </p>
                </div>

                {/* Evidence */}
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Evidence
                  </span>
                  <ul className="mt-0.5 space-y-0.5">
                    {insight.evidence.map((item, i) => (
                      <li
                        key={i}
                        className="text-xs text-foreground/80 flex items-start gap-1"
                      >
                        <span className="text-muted-foreground">▪</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interpretation */}
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Interpretation
                  </span>
                  <p className="text-xs text-foreground/80 mt-0.5">
                    {insight.interpretation}
                  </p>
                </div>

                {/* Risk */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400 uppercase tracking-wide">
                      Risk
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80">{insight.risk}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
