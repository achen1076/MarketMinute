"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import { Brain, Sparkles, ChevronDown } from "lucide-react";
import SentinelPreferences from "@/components/organisms/SentinelPreferences";
import ProfessionalInsights from "@/components/organisms/ProfessionalInsights";
import WhatThisMeans from "@/components/organisms/WhatThisMeans";
import VolatilityCard from "@/components/molecules/VolatilityCard";
import MarketSignalsCard from "@/components/molecules/MarketSignalsCard";
import MarketSummaryCard from "@/components/molecules/MarketSummaryCard";
import RegimeComponentsCard from "@/components/molecules/RegimeComponentsCard";

interface SentinelReport {
  id: string;
  createdAt: Date;
  summary: string;
  keyDrivers: any;
  macroContext: string | null;
  scenarioQuestions: any;
  whatThisMeans?: any;
  indexMove: boolean;
  sectorRotation: boolean;
  macroSurprise: boolean;
  volSpike: boolean;
  vix: number | null;
  vixChangePct: number | null;
  realizedVol: number | null;
}

export default function SentinelDashboardClient({
  latestReport,
  reports,
}: {
  latestReport: SentinelReport | null;
  reports: SentinelReport[];
}) {
  const [loading, setLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  async function runNewAnalysis() {
    setLoading(true);
    try {
      const res = await fetch("/api/sentinel", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate anomaly statistics
  const totalReports = reports.length;
  const anomalyStats = {
    indexMove: reports.filter((r) => r.indexMove).length,
    sectorRotation: reports.filter((r) => r.sectorRotation).length,
    macroSurprise: reports.filter((r) => r.macroSurprise).length,
    volSpike: reports.filter((r) => r.volSpike).length,
  };

  const avgVix =
    reports
      .filter((r) => r.vix !== null)
      .reduce((sum, r) => sum + (r.vix || 0), 0) / reports.length || 0;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20">
            <Brain className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Sentinel Intelligence
            </h1>
            <p className="text-slate-400">
              AI-powered market analysis & anomaly detection
            </p>
          </div>
        </div>
        <button
          onClick={runNewAnalysis}
          disabled={loading}
          className="px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles size={18} />
          {loading ? "Analyzing..." : "Run New Analysis"}
        </button>
      </div>

      {/* Professional 3-Column Grid Layout */}
      {latestReport ? (
        <>
          {/* Above the Fold */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT COLUMN - Market Data */}
            <div className="space-y-4">
              <VolatilityCard
                vix={latestReport.vix}
                vixChangePct={latestReport.vixChangePct}
                realizedVol={latestReport.realizedVol}
              />

              <MarketSignalsCard
                sectorRotation={latestReport.sectorRotation}
                indexMove={latestReport.indexMove}
                volSpike={latestReport.volSpike}
                macroSurprise={latestReport.macroSurprise}
              />
            </div>

            {/* CENTER COLUMN - Summary & Regime */}
            <div className="space-y-4">
              <MarketSummaryCard
                keyDrivers={latestReport.keyDrivers || []}
                vixChangePct={latestReport.vixChangePct}
                vix={latestReport.vix}
                sectorRotation={latestReport.sectorRotation}
              />

              <RegimeComponentsCard
                vix={latestReport.vix}
                sectorRotation={latestReport.sectorRotation}
              />
            </div>

            {/* RIGHT COLUMN - Key Insights */}
            <div className="space-y-4">
              {/* Top Insight */}
              <Card className="bg-linear-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">
                    Top Insight
                  </h3>
                  <p className="text-slate-100 text-sm font-medium leading-relaxed">
                    {latestReport.keyDrivers &&
                    latestReport.keyDrivers.length > 0
                      ? latestReport.keyDrivers[0]
                      : "Market activity within normal ranges."}
                  </p>
                </div>
              </Card>

              {/* Key Drivers */}
              <Card className="bg-slate-800/50 border-slate-700">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Key Drivers
                  </h3>
                  <ul className="space-y-2">
                    {latestReport.keyDrivers &&
                      latestReport.keyDrivers
                        .slice(0, 4)
                        .map((driver: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span className="text-slate-200 leading-tight">
                              {driver}
                            </span>
                          </li>
                        ))}
                  </ul>
                </div>
              </Card>

              {/* Macro Context */}
              {latestReport.macroContext && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <div className="p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                      Macro Context
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {latestReport.macroContext}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* What This Means - Narrative Summary */}
          {latestReport && <WhatThisMeans report={latestReport} />}

          {/* Structured Professional Insights */}
          <Card className="bg-slate-800/50 border-slate-700">
            <div className="p-4">
              <ProfessionalInsights reportContext={latestReport} />
            </div>
          </Card>
        </>
      ) : null}

      {/* Empty State */}
      {!latestReport && (
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-12 text-center">
            <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-300 mb-2">
              No Analysis Yet
            </h3>
            <p className="text-slate-400 mb-6">
              Run your first Sentinel analysis to see market insights here.
            </p>
            <button
              onClick={runNewAnalysis}
              disabled={loading}
              className="px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer mx-auto"
            >
              <Sparkles size={18} />
              {loading ? "Analyzing..." : "Run First Analysis"}
            </button>
          </div>
        </Card>
      )}

      {/* Historical Analysis */}
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Analysis History
          </h3>
          <div className="space-y-2">
            {reports.slice(0, 5).map((report) => {
              const date = new Date(report.createdAt);
              const regime =
                report.vix && report.vix > 25
                  ? "Risk-off"
                  : report.sectorRotation
                  ? "Risk-on"
                  : "Neutral";
              const isExpanded = expandedReport === report.id;

              return (
                <div
                  key={report.id}
                  className="border border-slate-700/50 rounded overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-2 bg-slate-900/30 hover:bg-slate-900/50 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedReport(isExpanded ? null : report.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-sm text-slate-200 font-medium">
                        {regime} Day
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.vix && (
                        <span className="text-xs text-slate-400">
                          VIX {report.vix.toFixed(1)}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 bg-slate-900/50 border-t border-slate-700/50 space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {report.summary}
                      </p>

                      {report.keyDrivers && report.keyDrivers.length > 0 && (
                        <div className="space-y-1">
                          {report.keyDrivers
                            .slice(0, 3)
                            .map((driver: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start gap-1.5 text-xs text-slate-400"
                              >
                                <span className="text-indigo-400 mt-0.5">
                                  •
                                </span>
                                <span>{driver}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* What This Means Section */}
                      {report.whatThisMeans && (
                        <div className="pt-2 border-t border-slate-700/50 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-indigo-400">
                              What This Means
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-slate-400">
                                What happened:
                              </span>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {(report.whatThisMeans as any).whatHappened}
                              </p>
                            </div>

                            <div>
                              <span className="text-xs font-medium text-slate-400">
                                Why it matters:
                              </span>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {(report.whatThisMeans as any).whyItMatters}
                              </p>
                            </div>

                            {(report.whatThisMeans as any).whatToWatch && (
                              <div>
                                <span className="text-xs font-medium text-slate-400">
                                  Watch tomorrow:
                                </span>
                                <ul className="text-xs text-slate-300 mt-0.5 space-y-0.5">
                                  {(report.whatThisMeans as any).whatToWatch
                                    .slice(0, 3)
                                    .map((item: string, idx: number) => (
                                      <li
                                        key={idx}
                                        className="flex items-start gap-1.5"
                                      >
                                        <span className="text-indigo-400 mt-0.5">
                                          •
                                        </span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {reports.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">
                No analysis history yet
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Personalization */}
      {/* <SentinelPreferences /> */}
    </div>
  );
}
