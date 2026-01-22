"use client";

import Link from "next/link";
import { AnalysisCard } from "@/components/molecules/AnalysisCard";
import type { ExpectationGapAnalysis } from "@shared/lib/types";

export function AnalyzeLanding() {
  const features = [
    {
      title: "Expectation Gap Analysis",
      description:
        "Understand what's driving price moves - fundamentals, positioning, narrative, or noise",
    },
    {
      title: "Confidence Calibration",
      description:
        "Every classification comes with a confidence score so you know when to trust the signal",
    },
    {
      title: "Second-Order Context",
      description:
        "See sector performance, market indices, and correlated tickers to understand the full picture",
    },
    {
      title: "Invalidation Triggers",
      description:
        "Know exactly when your thesis breaks - clear exit signals for every analysis",
    },
  ];

  const mockAnalyses: ExpectationGapAnalysis[] = [
    {
      symbol: "GOOGL",
      trigger: "manual",
      priceMove: {
        symbol: "GOOGL",
        currentPrice: 142.35,
        previousClose: 143.65,
        change: -1.3,
        changePct: -0.9,
        volume: 28500000,
        avgVolume: 25000000,
        volumeRatio: 1.14,
        timestamp: new Date().toISOString(),
        intradayHigh: 143.8,
        intradayLow: 141.9,
        intradayRange: 1.32,
      },
      baseline: {
        symbol: "GOOGL",
        iv30: 0.28,
        ivPercentile: 50,
        impliedMove: 0.012,
        lastUpdated: new Date().toISOString(),
      },
      gap: {
        expectedMove: 1.2,
        actualMove: -0.9,
        moveGap: -2.1,
        moveGapRatio: 0.75,
        sentimentMoveAlignment: "neutral",
        fundamentalNews: false,
        fundamentalDelta: undefined,
        classification: "noise",
        classificationConfidence: 0.5,
        evidencePoints: [
          "Move of 0.9% within normal range",
          "No significant catalyst identified",
          "Likely random walk / market microstructure",
        ],
      },
      secondOrder: {
        sectorEtf: "XLK",
        sectorMove: 0.1,
        isIdiosyncratic: false,
        correlatedTickers: [
          { symbol: "MSFT", move: 0.2, correlation: 0.72 },
          { symbol: "META", move: -0.5, correlation: 0.68 },
        ],
        macroFactors: [
          { factor: "SPY", move: -0.3, impact: "neutral" },
          { factor: "QQQ", move: -0.2, impact: "neutral" },
        ],
        primaryDriver: undefined,
      },
      narrative: {
        ticker: "GOOGL",
        classification: "noise",
        confidence: "low",
        move: "-0.9% (vs ±1.2% options-implied, front expiry)               ",
        relative:
          "Modest underperformance vs XLK, within historical dispersion",
        timeHorizon: "1D reaction",
        expectationSource:
          "1D options implied move (median percentile, front expiry)",
        primaryRead:
          "Move within normal volatility regime (<1σ) with no GOOGL-specific fundamental update. Neutral sentiment. ",
        catalystCheck:
          "No catalyst identified. Move appears to be normal market fluctuation.",
        secondOrderEffects: [
          "XLK +0.1%",
          "SPY -0.3%",
          "QQQ -0.2%",
          "AVGO -0.6%",
        ],
        invalidation:
          "Breaks if pattern persists 3+ days or GOOGL moves >2σ from here.",
        decisionImplication:
          "No action warranted. Normal fluctuation within expected range. Follow-up analysis warranted.",
        generatedAt: new Date().toISOString(),
      },
      analysisId: "EGE-GOOGL-001",
      createdAt: new Date().toISOString(),
    },
    {
      symbol: "NVDA",
      trigger: "manual",
      priceMove: {
        symbol: "NVDA",
        currentPrice: 128.5,
        previousClose: 125.2,
        change: 3.3,
        changePct: 2.64,
        volume: 52000000,
        avgVolume: 45000000,
        volumeRatio: 1.16,
        timestamp: new Date().toISOString(),
        intradayHigh: 129.1,
        intradayLow: 126.8,
        intradayRange: 1.84,
      },
      baseline: {
        symbol: "NVDA",
        iv30: 0.42,
        ivPercentile: 65,
        impliedMove: 0.025,
        lastUpdated: new Date().toISOString(),
      },
      gap: {
        expectedMove: 2.5,
        actualMove: 2.64,
        moveGap: 0.14,
        moveGapRatio: 1.06,
        sentimentMoveAlignment: "aligned",
        fundamentalNews: true,
        fundamentalDelta: "AI chip demand commentary from major cloud provider",
        classification: "narrative",
        classificationConfidence: 0.6,
        evidencePoints: [
          "Non-fundamental news driving sentiment",
          "News sentiment: positive",
          "Market reacting to narrative, not fundamentals",
        ],
      },
      secondOrder: {
        sectorEtf: "XLK",
        sectorMove: 0.8,
        isIdiosyncratic: true,
        correlatedTickers: [
          { symbol: "AMD", move: 1.8, correlation: 0.75 },
          { symbol: "AVGO", move: 1.2, correlation: 0.68 },
        ],
        macroFactors: [
          { factor: "SPY", move: 0.4, impact: "positive" },
          { factor: "QQQ", move: 0.6, impact: "positive" },
        ],
        primaryDriver: "Tech sector strength",
      },
      narrative: {
        ticker: "NVDA",
        classification: "narrative",
        confidence: "medium",
        move: "+2.64% (vs ±2.5% options-implied, front expiry)",
        relative: "Strong outperformance vs XLK, notable relative strength",
        timeHorizon: "1D reaction",
        expectationSource:
          "1D options implied move (65th percentile, front expiry)",
        primaryRead:
          "Sentiment-driven move (~1σ) without fundamental confirmation. Narrative active but unverified.",
        catalystCheck:
          "Narrative catalyst surfaced but lacked novelty or NVDA-specific confirmation.",
        secondOrderEffects: [
          "XLK +0.8%",
          "SPY +0.4%",
          "QQQ +0.6%",
          "AMD +1.8%",
        ],
        invalidation:
          "Breaks if NVDA reverses >1.5% on no new news or narrative fades within 2 sessions.",
        decisionImplication:
          "Monitor for fundamental confirmation. Narrative-driven moves often fade without follow-through.",
        generatedAt: new Date().toISOString(),
      },
      analysisId: "EGE-NVDA-002",
      createdAt: new Date().toISOString(),
    },
    {
      symbol: "TSLA",
      trigger: "manual",
      priceMove: {
        symbol: "TSLA",
        currentPrice: 248.75,
        previousClose: 242.5,
        change: 6.25,
        changePct: 2.58,
        volume: 125000000,
        avgVolume: 95000000,
        volumeRatio: 1.32,
        timestamp: new Date().toISOString(),
        intradayHigh: 250.2,
        intradayLow: 243.8,
        intradayRange: 2.64,
      },
      baseline: {
        symbol: "TSLA",
        iv30: 0.55,
        ivPercentile: 72,
        impliedMove: 0.032,
        lastUpdated: new Date().toISOString(),
      },
      gap: {
        expectedMove: 3.2,
        actualMove: 2.58,
        moveGap: -0.62,
        moveGapRatio: 0.81,
        sentimentMoveAlignment: "aligned",
        fundamentalNews: false,
        fundamentalDelta: undefined,
        classification: "positioning",
        classificationConfidence: 0.7,
        evidencePoints: [
          "Volume spike: 1.3x average",
          "No fundamental news catalyst",
          "Possible institutional positioning change",
        ],
      },
      secondOrder: {
        sectorEtf: "XLK",
        sectorMove: 0.3,
        isIdiosyncratic: true,
        correlatedTickers: [
          { symbol: "RIVN", move: 3.2, correlation: 0.58 },
          { symbol: "LCID", move: 2.8, correlation: 0.52 },
        ],
        macroFactors: [
          { factor: "SPY", move: 0.2, impact: "neutral" },
          { factor: "QQQ", move: 0.3, impact: "neutral" },
        ],
        primaryDriver: undefined,
      },
      narrative: {
        ticker: "TSLA",
        classification: "positioning",
        confidence: "medium",
        move: "+2.58% (vs ±3.2% options-implied, front expiry)",
        relative:
          "Strong outperformance vs XLK, significant idiosyncratic move",
        timeHorizon: "1D reaction",
        expectationSource:
          "1D options implied move (72th pctile, front expiry)",
        primaryRead:
          "Flow-driven move within normal volatility regime (<1σ). No fundamental repricing detected.",
        catalystCheck:
          "No earnings, guidance, or material announcement detected.",
        secondOrderEffects: [
          "XLK +0.3%",
          "SPY +0.2%",
          "QQQ +0.3%",
          "RIVN +3.2%",
        ],
        invalidation:
          "Breaks if volume normalizes and TSLA mean-reverts within 2 sessions.",
        decisionImplication:
          "Flow-driven move may reverse. Watch for follow-through or fade.",
        generatedAt: new Date().toISOString(),
      },
      analysisId: "EGE-TSLA-003",
      createdAt: new Date().toISOString(),
    },
    {
      symbol: "AAPL",
      trigger: "manual",
      priceMove: {
        symbol: "AAPL",
        currentPrice: 189.25,
        previousClose: 185.5,
        change: 3.75,
        changePct: 2.02,
        volume: 68000000,
        avgVolume: 55000000,
        volumeRatio: 1.24,
        timestamp: new Date().toISOString(),
        intradayHigh: 189.8,
        intradayLow: 186.2,
        intradayRange: 1.94,
      },
      baseline: {
        symbol: "AAPL",
        iv30: 0.22,
        ivPercentile: 45,
        impliedMove: 0.015,
        lastUpdated: new Date().toISOString(),
      },
      gap: {
        expectedMove: 1.5,
        actualMove: 2.02,
        moveGap: 0.52,
        moveGapRatio: 1.35,
        sentimentMoveAlignment: "aligned",
        fundamentalNews: true,
        fundamentalDelta: "iPhone sales beat expectations in China market",
        classification: "fundamental",
        classificationConfidence: 0.85,
        evidencePoints: [
          "Fundamental news detected (earnings, guidance, M&A, etc.)",
          "Move of 2.0% exceeds expected 1.5%",
          "News sentiment aligns with price direction",
        ],
      },
      secondOrder: {
        sectorEtf: "XLK",
        sectorMove: 0.5,
        isIdiosyncratic: true,
        correlatedTickers: [
          { symbol: "MSFT", move: 0.8, correlation: 0.68 },
          { symbol: "GOOGL", move: 0.4, correlation: 0.62 },
        ],
        macroFactors: [
          { factor: "SPY", move: 0.3, impact: "positive" },
          { factor: "QQQ", move: 0.5, impact: "positive" },
        ],
        primaryDriver: "Company-specific news",
      },
      narrative: {
        ticker: "AAPL",
        classification: "fundamental",
        confidence: "high",
        move: "+2.02% (vs ±1.5% options-implied, front expiry)",
        relative: "Strong outperformance vs XLK, notable relative strength",
        timeHorizon: "1D reaction",
        expectationSource: "1D options implied move (median, front expiry)",
        primaryRead:
          "Move driven by fundamental catalyst with ~1σ magnitude. News sentiment confirms price action.",
        catalystCheck:
          "Catalyst confirmed: iPhone sales beat expectations in China market. Material to AAPL outlook.",
        secondOrderEffects: [
          "XLK +0.5%",
          "SPY +0.3%",
          "QQQ +0.5%",
          "MSFT +0.8%",
        ],
        invalidation:
          "Breaks if AAPL fully reverses on no new information within 2 sessions.",
        decisionImplication:
          "Fundamental repricing likely justified. Monitor for follow-through or guidance updates.",
        generatedAt: new Date().toISOString(),
      },
      analysisId: "EGE-AAPL-004",
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="relative w-full px-4 md:px-0 mx-auto mt-8 md:mt-16 pb-24 md:pb-16 space-y-8">
      <div className="relative z-10 text-center space-y-4 mb-8 md:mb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Expectation Gap Engine
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Understand what&apos;s really driving price moves. Get
          institutional-grade analysis that separates signal from noise with
          confidence calibration and clear invalidation triggers.
        </p>
      </div>

      <div className="relative mb-8 md:mb-20">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

        <div className="relative max-w-4xl mx-auto">
          <div className="hidden lg:block absolute -top-8 -left-12 w-[480px] transform -rotate-6 scale-95 opacity-40 blur-[2px] z-0">
            <AnalysisCard analysis={mockAnalyses[2]} />
          </div>

          <div className="hidden lg:block absolute -top-8 -right-12 w-[480px] transform rotate-6 scale-95 opacity-40 blur-[2px] z-0">
            <AnalysisCard analysis={mockAnalyses[3]} />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 px-0 md:px-4">
            <div className="transform md:hover:scale-105 md:hover:-translate-y-2 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/20">
              <AnalysisCard analysis={mockAnalyses[0]} />
            </div>
            <div className="transform md:hover:scale-105 md:hover:-translate-y-2 transition-all duration-300 shadow-2xl hover:shadow-teal-500/20">
              <AnalysisCard analysis={mockAnalyses[1]} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:w-[70vw] mx-auto">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="p-6 rounded-xl border border-border bg-card transform hover:scale-102 transition-all duration-300 hover:bg-emerald-500/10 hover:border-emerald-500"
          >
            <div className="flex items-start gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 md:p-10 text-center rounded-xl border border-emerald-500/20 bg-card lg:w-[70vw] mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-3">
          Ready to analyze price moves?
        </h2>
        <p className="text-muted-foreground mb-6 md:mb-8 text-base md:text-lg">
          Sign in to run live analyses and save cards to your library
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
        >
          Sign In to Get Started
        </Link>
      </div>
    </div>
  );
}
