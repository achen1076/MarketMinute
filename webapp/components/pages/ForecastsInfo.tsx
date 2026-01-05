"use client";

import Link from "next/link";
import Card from "@/components/atoms/Card";
import { ForecastCard } from "@/components/molecules/ForecastCard";
import type { DistributionalForecast } from "@/types/quant";
import { QuantLabAvailableTickers } from "@/components/molecules/QuantLabAvailableTickers";

export default function ForecastsInfo() {
  const features = [
    {
      title: "Distributional Forecasts",
      description:
        "See expected price ranges with probability distributions, not just single point estimates",
    },
    {
      title: "Price Targets",
      description:
        "Multiple price targets with associated probabilities for bullish and bearish scenarios",
    },
    {
      title: "Volatility Analysis",
      description:
        "Historical and implied volatility metrics to understand expected price movement ranges",
    },
    {
      title: "Probability Distribution",
      description:
        "Likelyhood of price movement based on historical data and model predictions",
    },
  ];

  // Mock forecast data for preview
  const mockForecasts: DistributionalForecast[] = [
    {
      ticker: "AAPL",
      current_price: 185.5,
      expected_range_pct: 2.3,
      upper_bound: 189.75,
      lower_bound: 181.25,
      directional_bias: "Bullish",
      conviction: "High",
      conviction_score: 0.85,
      most_likely_category: "mild_up",
      prob_large_up: 0.15,
      prob_mild_up: 0.4,
      prob_flat: 0.25,
      prob_mild_down: 0.15,
      prob_large_down: 0.05,
      p10: 180.2,
      p50: 185.5,
      p90: 190.8,
      timestamp: new Date().toISOString(),
    },
    {
      ticker: "NVDA",
      current_price: 495.3,
      expected_range_pct: 3.8,
      upper_bound: 514.12,
      lower_bound: 476.48,
      directional_bias: "Bearish",
      conviction: "Medium",
      conviction_score: 0.65,
      most_likely_category: "mild_down",
      prob_large_up: 0.1,
      prob_mild_up: 0.2,
      prob_flat: 0.25,
      prob_mild_down: 0.3,
      prob_large_down: 0.15,
      p10: 470.15,
      p50: 495.3,
      p90: 520.45,
      timestamp: new Date().toISOString(),
    },
    {
      ticker: "MSFT",
      current_price: 378.5,
      expected_range_pct: 1.9,
      upper_bound: 385.69,
      lower_bound: 371.31,
      directional_bias: "Neutral",
      conviction: "Low",
      conviction_score: 0.45,
      most_likely_category: "flat",
      prob_large_up: 0.12,
      prob_mild_up: 0.28,
      prob_flat: 0.35,
      prob_mild_down: 0.2,
      prob_large_down: 0.05,
      p10: 368.8,
      p50: 378.5,
      p90: 388.2,
      timestamp: new Date().toISOString(),
    },
    {
      ticker: "TSLA",
      current_price: 242.75,
      expected_range_pct: 4.2,
      upper_bound: 252.95,
      lower_bound: 232.55,
      directional_bias: "Bullish",
      conviction: "Medium",
      conviction_score: 0.72,
      most_likely_category: "mild_up",
      prob_large_up: 0.18,
      prob_mild_up: 0.38,
      prob_flat: 0.22,
      prob_mild_down: 0.18,
      prob_large_down: 0.04,
      p10: 228.4,
      p50: 242.75,
      p90: 257.1,
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <div className="relative w-full px-4 md:px-0 mx-auto mt-8 md:mt-16 pb-24 md:pb-16 space-y-8">
      {/* Hero Section with floating background elements */}
      <div className="relative z-10 text-center space-y-4 mb-8 md:mb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground bg-clip-text">
          Market Forecasts
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Probabilistic price forecasts showing expected ranges and
          distributions. Understand where prices might go with confidence
          intervals, not just single predictions.
        </p>
      </div>

      {/* Stylish 3D Card Showcase */}
      <div className="relative mb-8 md:mb-20">
        {/* Background decorative element */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10" />

        {/* Stacked cards with 3D effect */}
        <div className="relative max-w-4xl mx-auto">
          {/* Background Card 1 - Top Left - Hidden on mobile */}
          <div className="hidden lg:block absolute -top-8 -left-12 w-[380px] transform -rotate-6 scale-95 opacity-40 blur-[2px] z-0">
            <ForecastCard forecast={mockForecasts[2]} hover={false} />
          </div>

          {/* Background Card 2 - Top Right - Hidden on mobile */}
          <div className="hidden lg:block absolute -top-8 -right-12 w-[380px] transform rotate-6 scale-95 opacity-40 blur-[2px] z-0">
            <ForecastCard forecast={mockForecasts[3]} hover={false} />
          </div>
          {/* Main showcase cards - elevated */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 px-0 md:px-4">
            <div className="transform md:hover:scale-105 md:hover:-translate-y-2 transition-all duration-300 shadow-2xl hover:shadow-teal-500/20">
              <ForecastCard forecast={mockForecasts[0]} hover={false} />
            </div>
            <div className="transform md:hover:scale-105 md:hover:-translate-y-2 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/20">
              <ForecastCard forecast={mockForecasts[1]} hover={false} />
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
              className="p-6 transform hover:scale-102 transition-all duration-300 hover:bg-teal-500/10 hover:border-teal-500"
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
      <div className="rounded-lg border-2 border-teal-500/30 bg-teal-500/5 p-6 lg:w-[70vw] mx-auto">
        <div className="flex items-start gap-3">
          <div className="text-teal-500 text-2xl">📊</div>
          <div>
            <h2 className="text-lg font-bold text-teal-500 mb-2">
              Probabilistic Analysis Tool
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              <strong>Educational Tool:</strong> These forecasts show expected
              price ranges and probability distributions based on historical
              volatility and model predictions. Use as one of many inputs for
              research and learning, not as trading advice.
            </p>
          </div>
        </div>
      </div>

      <div className="lg:w-[70vw] mx-auto">
        <QuantLabAvailableTickers />
      </div>

      {/* CTA */}
      <Card className="p-6 md:p-10 text-center  border-teal-500/20 lg:w-[70vw] mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-3">
          Ready to see price forecasts?
        </h2>
        <p className="text-muted-foreground mb-6 md:mb-8 text-base md:text-lg">
          Sign in to access distributional forecasts for your watchlist stocks
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors"
        >
          Sign In to Get Started
        </Link>
      </Card>
    </div>
  );
}
