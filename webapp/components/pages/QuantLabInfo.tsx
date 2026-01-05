"use client";

import Link from "next/link";
import Card from "@/components/atoms/Card";
import { EnhancedPredictionCard } from "@/components/molecules/EnhancedPredictionCard";
import type { EnhancedSignal } from "@/types/quant";

export default function QuantLabInfo() {
  const features = [
    {
      title: "ML-Powered Predictions",
      description:
        "Machine learning models trained on historical price patterns and 30+ technical indicators to generate directional signals",
    },
    {
      title: "Quant Scores",
      description:
        "Each signal comes with a confidence score (0-100) based on model certainty and historical accuracy",
    },
    {
      title: "Model Quality Metrics",
      description:
        "Transparent metrics showing each model's performance and reliability tier",
    },
    {
      title: "News Impact",
      description:
        "News based updating and optimization of signals and probabilities",
    },
  ];

  // Mock signal data for preview
  const mockSignals: EnhancedSignal[] = [
    {
      ticker: "TSLA",
      current_price: 438.07,
      timestamp: new Date().toISOString(),
      quantScore: 45,
      rawQuantScore: 78,
      edge: 0.15,
      edgeDirectional: -0.08,
      regime: "High Volatility Uptrend",
      expectedReturn: -0.0145,
      expectedVolatility: 0.042,
      prob1PctMove: 0.75,
      prob2PctMove: 0.58,
      signalDescription:
        "Negative news significantly weakened bullish momentum, high volatility",
      tradingInterpretation:
        "Major negative sentiment shift from breaking news",
      prob_up: 0.25,
      prob_down: 0.55,
      prob_neutral: 0.2,
      directionalConfidence: 0.55,
      signal: "SELL",
      confidence: 0.45,
      raw_prob_up: 0.72,
      raw_prob_down: 0.15,
      raw_prob_neutral: 0.13,
      raw_signal: "BUY",
      news_count: 8,
      should_trade: false,
      take_profit: null,
      stop_loss: null,
      atr: 5.85,
      isTradeable: false,
      model_quality: {
        sharpe_ratio: 1.42,
        profit_factor: 1.85,
        win_rate: 0.55,
        num_trades: 178,
        max_drawdown: -0.22,
        deployable: true,
        quality_tier: "good",
      },
    },
    {
      ticker: "META",
      current_price: 650.41,
      timestamp: new Date().toISOString(),
      quantScore: 67,
      rawQuantScore: 65,
      edge: 0.1,
      edgeDirectional: 0.14,
      regime: "Stable Uptrend",
      expectedReturn: 0.0185,
      expectedVolatility: 0.018,
      prob1PctMove: 0.52,
      prob2PctMove: 0.28,
      signalDescription:
        "Moderate bullish signal with stable momentum and low volatility",
      tradingInterpretation: "Steady upward bias with medium confidence",
      prob_up: 0.56,
      prob_down: 0.22,
      prob_neutral: 0.22,
      directionalConfidence: 0.68,
      signal: "BUY",
      confidence: 0.67,
      raw_prob_up: 0.52,
      raw_prob_down: 0.25,
      raw_prob_neutral: 0.23,
      raw_signal: "BUY",
      news_count: 2,
      should_trade: false,
      take_profit: null,
      stop_loss: null,
      atr: 3.25,
      isTradeable: true,
      model_quality: {
        sharpe_ratio: 1.85,
        profit_factor: 2.3,
        win_rate: 0.58,
        num_trades: 142,
        max_drawdown: -0.18,
        deployable: true,
        quality_tier: "excellent",
      },
    },
    {
      ticker: "AAPL",
      current_price: 185.5,
      timestamp: new Date().toISOString(),
      quantScore: 58,
      rawQuantScore: 58,
      edge: 0.08,
      edgeDirectional: 0.09,
      regime: "Ranging Market",
      expectedReturn: 0.0095,
      expectedVolatility: 0.015,
      prob1PctMove: 0.45,
      prob2PctMove: 0.22,
      signalDescription: "Neutral signal with low conviction",
      tradingInterpretation:
        "Market showing indecision, wait for clearer signals",
      prob_up: 0.42,
      prob_down: 0.35,
      prob_neutral: 0.23,
      directionalConfidence: 0.42,
      signal: "NEUTRAL",
      confidence: 0.58,
      should_trade: false,
      take_profit: null,
      stop_loss: null,
      atr: 2.85,
      isTradeable: false,
      model_quality: {
        sharpe_ratio: 0.95,
        profit_factor: 1.45,
        win_rate: 0.51,
        num_trades: 205,
        max_drawdown: -0.28,
        deployable: true,
        quality_tier: "marginal",
      },
    },
    {
      ticker: "NVDA",
      current_price: 495.3,
      timestamp: new Date().toISOString(),
      quantScore: 42,
      rawQuantScore: 42,
      edge: 0.05,
      edgeDirectional: -0.08,
      regime: "High Volatility Downtrend",
      expectedReturn: -0.0125,
      expectedVolatility: 0.038,
      prob1PctMove: 0.72,
      prob2PctMove: 0.51,
      signalDescription: "Bearish pressure with weak momentum",
      tradingInterpretation: "Model suggests potential downward movement",
      prob_up: 0.22,
      prob_down: 0.58,
      prob_neutral: 0.2,
      directionalConfidence: 0.58,
      signal: "SELL",
      confidence: 0.42,
      should_trade: false,
      take_profit: null,
      stop_loss: null,
      atr: 8.45,
      isTradeable: false,
      model_quality: {
        sharpe_ratio: 0.62,
        profit_factor: 1.15,
        win_rate: 0.48,
        num_trades: 95,
        max_drawdown: -0.35,
        deployable: false,
        quality_tier: "poor",
      },
    },
  ];

  return (
    <div className="relative w-full px-4 md:px-0 mx-auto mt-8 md:mt-16 pb-24 md:pb-16 space-y-8">
      {/* Hero Section with floating background elements */}
      <div className="relative z-10 text-center space-y-4 mb-8 md:mb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Quant Lab
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Quantitative model predictions and research tools powered by machine
          learning. Get directional signals with confidence scores for your
          watchlist stocks.
        </p>
      </div>

      {/* Stylish 3D Card Showcase */}
      <div className="relative mb-8 md:mb-20">
        {/* Background decorative element */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10" />
        {/* Stacked cards with 3D effect */}
        <div className="relative max-w-4xl mx-auto">
          {/* Background Card 1 - Top Left - Hidden on mobile */}
          <div className="hidden lg:block absolute -top-8 -left-12 w-[430px] transform -rotate-6 scale-95 opacity-40 blur-[2px] z-0">
            <EnhancedPredictionCard
              hover={false}
              signal={mockSignals[2]}
              quality={mockSignals[2].model_quality}
            />
          </div>

          {/* Background Card 2 - Top Right - Hidden on mobile */}
          <div className="hidden lg:block absolute -top-8 -right-12 w-[430px] transform rotate-6 scale-95 opacity-40 blur-[2px] z-0">
            <EnhancedPredictionCard
              hover={false}
              signal={mockSignals[3]}
              quality={mockSignals[3].model_quality}
            />
          </div>

          {/* Main showcase cards - elevated */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 px-0 md:px-4">
            <div className="transform md:hover:scale-105 md:hover:-translate-y-2 transition-all duration-300 shadow-2xl hover:shadow-amber-500/20 xl:w-[430px]">
              <EnhancedPredictionCard
                hover={false}
                signal={mockSignals[0]}
                quality={mockSignals[0].model_quality}
              />
            </div>
            <div className="transform md:hover:scale-105 md:hover:-translate-y-2 transition-all duration-300 shadow-2xl hover:shadow-orange-500/20 xl:w-[430px]">
              <EnhancedPredictionCard
                hover={false}
                signal={mockSignals[1]}
                quality={mockSignals[1].model_quality}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 lg:w-[70vw] mx-auto">
        {features.map((feature) => {
          return (
            <Card
              key={feature.title}
              className="p-6 transform hover:scale-102 transition-all duration-300 hover:bg-amber-500/10 hover:border-amber-500"
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
            </Card>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border-2 border-amber-500/30 bg-amber-500/5 p-6 lg:w-[70vw] mx-auto">
        <div className="flex items-start gap-3">
          <div className="text-amber-500 text-2xl">⚠️</div>
          <div>
            <h2 className="text-lg font-bold text-amber-500 mb-2">
              Educational & Research Tool
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              <strong>Not Financial Advice:</strong> All model outputs are
              hypothetical probabilities based on historical patterns. Past
              performance does not guarantee future results. These tools are for
              research and educational purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* <div className="lg:w-[70vw] mx-auto">
        <QuantLabAvailableTickers />
      </div> */}

      {/* CTA */}
      <Card className="p-6 md:p-10 text-center border-amber-500/20 lg:w-[70vw] mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-3">
          Ready to explore Quant Lab?
        </h2>
        <p className="text-muted-foreground mb-6 md:mb-8 text-base md:text-lg">
          Sign in to access ML-powered signals for your watchlist stocks
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
        >
          Sign In to Get Started
        </Link>
      </Card>
    </div>
  );
}
