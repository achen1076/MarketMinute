"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import { HelpCircle, ChevronDown } from "lucide-react";

interface WhatThisMeansData {
  whatHappened: string;
  whyItMatters: string;
  whatCouldHappenNext: string;
  whatToWatch: string[];
}

interface SentinelReport {
  summary: string;
  volSpike: boolean;
  vixChangePct: number | null;
  sectorRotation: boolean;
  indexMove: boolean;
  vix: number | null;
  macroSurprise: boolean;
  macroContext: string | null;
  whatThisMeans?: WhatThisMeansData | any;
}

interface WhatThisMeansProps {
  report: SentinelReport;
}

export default function WhatThisMeans({ report }: WhatThisMeansProps) {
  const [showExplainer, setShowExplainer] = useState(false);

  // Use structured data if available, otherwise generate from report data
  const whatThisMeans = report.whatThisMeans as WhatThisMeansData | undefined;

  return (
    <Card className="bg-linear-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
      <div
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-slate-800/30 transition-colors"
        onClick={() => setShowExplainer(!showExplainer)}
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">
            What This Means
          </h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${
            showExplainer ? "rotate-180" : ""
          }`}
        />
      </div>

      {showExplainer && (
        <div className="px-4 pb-4 space-y-4">
          <div className="pt-4 border-t border-slate-700/50 space-y-4">
            {/* What Happened Today */}
            <div>
              <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                What happened today
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {whatThisMeans?.whatHappened ||
                  report.summary ||
                  "Markets traded within recent ranges with mixed sector performance."}
              </p>
            </div>

            {/* Why It Matters */}
            <div>
              <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                Why it matters
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {whatThisMeans?.whyItMatters ||
                  (report.volSpike &&
                  report.vixChangePct &&
                  report.vixChangePct > 10
                    ? `Volatility spiked ${report.vixChangePct.toFixed(
                        0
                      )}% today. When VIX moves this much, it often signals shifting investor sentiment. Markets tend to stay choppy for a few days after these moves.`
                    : report.sectorRotation
                    ? "We're seeing capital rotate between sectors. This type of movement often happens when investors are repositioning for a new phase in the cycle, or reacting to changing economic data."
                    : report.indexMove
                    ? "The major indices made a notable directional move today. When markets move decisively, it's worth watching whether the move has follow-through or reverses."
                    : report.vix && report.vix < 15
                    ? "Volatility remains low, suggesting investors are comfortable with current conditions. Low volatility environments can persist, but they don't last forever."
                    : "The market is in a relatively balanced state. No major anomalies detected, which suggests normal trading conditions without extreme positioning.")}
              </p>
            </div>

            {/* What Could Happen Next */}
            <div>
              <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                What could happen next
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {whatThisMeans?.whatCouldHappenNext ||
                  (report.volSpike
                    ? "After volatility spikes, markets typically take a few sessions to stabilize. We could see continued choppiness, or if sentiment improves, a snapback rally."
                    : report.sectorRotation
                    ? "If the rotation continues, look for strength in the sectors gaining momentum. If it reverses, it might have been a head-fake."
                    : report.vix && report.vix < 15
                    ? "In low volatility periods, markets can grind higher gradually. However, these calm periods sometimes end abruptly when unexpected news hits."
                    : "With no extreme signals, the near-term path depends on upcoming economic data and company earnings. Markets could drift in either direction.")}
              </p>
            </div>

            {/* What to Watch Tomorrow */}
            <div>
              <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                What to watch tomorrow
              </h4>
              <ul className="text-sm text-slate-300 leading-relaxed space-y-1.5">
                {whatThisMeans?.whatToWatch &&
                whatThisMeans.whatToWatch.length > 0 ? (
                  whatThisMeans.whatToWatch.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <>
                    {report.volSpike && (
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>
                          Whether volatility continues to rise or if today was a
                          one-day spike
                        </span>
                      </li>
                    )}
                    {report.sectorRotation && (
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>
                          If the sectors that led today continue their momentum
                        </span>
                      </li>
                    )}
                    {report.macroSurprise && (
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>
                          How markets digest today's economic data and whether
                          it changes expectations
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>
                        {report.vix && report.vix > 25
                          ? "Any signs that fear is easing (VIX declining)"
                          : "Any uptick in volatility or signs of changing sentiment"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>
                        Overnight futures and international market reaction
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Macro Context (if available) */}
            {report.macroContext && (
              <div className="pt-3 border-t border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">
                  Broader context
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {report.macroContext}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
