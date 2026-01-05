"use client";

import Link from "next/link";
import Card from "@/components/atoms/Card";
import { Shield } from "lucide-react";

export default function SentinelInfo() {
  const features = [
    {
      title: "Daily Market Alerts",
      description:
        "AI-generated daily summaries highlighting the most important market movements and events",
    },
    {
      title: "Volatility Monitoring",
      description:
        "Track VIX levels, realized volatility, and market stress indicators in real-time",
    },
    {
      title: "Macro Context",
      description:
        "Understand how broader economic factors are influencing market behavior",
    },
    {
      title: "Risk Assessment",
      description:
        "Get notified about sector rotations, macro surprises, and potential risk events",
    },
  ];

  const mockReport = {
    date: "January 4, 2026",
    marketStatus: "Cautious",
    statusColor: "amber",
    vix: { value: 18.42, change: 2.3, status: "Elevated" },
    summary:
      "Markets opened mixed with technology leading gains while energy lagged. Bond yields ticked higher on strong jobs data, creating mild headwinds for rate-sensitive sectors.",
    keyDrivers: [
      {
        title: "Strong Jobs Report",
        impact: "bearish",
        description:
          "NFP came in at 256K vs 165K expected, pushing yields higher",
      },
      {
        title: "Tech Rotation",
        impact: "bullish",
        description:
          "Mega-cap tech seeing renewed buying after Q4 earnings optimism",
      },
      {
        title: "Oil Weakness",
        impact: "neutral",
        description: "WTI crude down 1.2% on China demand concerns",
      },
    ],
    sectorPerformance: [
      { name: "Technology", change: 1.24, color: "emerald" },
      { name: "Healthcare", change: 0.45, color: "emerald" },
      { name: "Financials", change: 0.12, color: "emerald" },
      { name: "Consumer", change: -0.28, color: "rose" },
      { name: "Energy", change: -1.15, color: "rose" },
    ],
    scenarios: [
      "What if bond yields break above 4.75%?",
      "How would China stimulus impact commodities?",
      "Could tech earnings disappoint expectations?",
    ],
  };

  return (
    <div className="relative w-[70vw] mx-auto mt-16 pb-16 space-y-8">
      {/* Hero Section */}
      <div className="relative z-10 text-center space-y-4 mb-20">
        <h1 className="text-4xl font-bold text-foreground">
          Sentinel Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Your market early warning system. Get AI-powered daily briefings on
          market conditions, volatility spikes, sector rotations, and macro
          events that could impact your portfolio.
        </p>
      </div>

      {/* Background decorative element */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

      {/* Professional 3-Column Grid Layout Preview */}
      <div className="relative mb-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Sentinel Intelligence
              </h2>
              <p className="text-sm text-muted-foreground">
                AI-powered market analysis & anomaly detection
              </p>
            </div>
          </div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-start">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-4 h-full">
              {/* Volatility */}
              <Card className="bg-card border-border">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Volatility
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">VIX</span>
                      <span className="text-2xl font-bold text-foreground">
                        14.95
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Realized</span>
                      <span className="text-foreground">0.1%</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Market Signals */}
              <Card className="bg-card border-border">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Market Signals
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-sm font-medium text-foreground">
                          Sector Rotation
                        </span>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">
                        High
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-3.5">
                      Often precedes broadening breadth
                    </p>
                  </div>
                </div>
              </Card>

              {/* Macro Context */}
              <Card className="bg-card border-border flex-1">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Macro Context
                  </h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    There were no major economic reports today.
                  </p>
                </div>
              </Card>
            </div>

            {/* CENTER COLUMN */}
            <div className="flex flex-col gap-4 h-full">
              {/* Market Summary */}
              <Card className="bg-card border-border">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Market Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[70px] text-xs">
                        Equities:
                      </span>
                      <span className="text-foreground">
                        IWM rose about 1.06%, making small-cap stocks the day's
                        top driver.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[70px] text-xs">
                        Sectors:
                      </span>
                      <span className="text-foreground">
                        DIA climbed about 0.64%, helping large-cap value names.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[70px] text-xs">
                        Volatility:
                      </span>
                      <span className="text-foreground">
                        VIX ↑ 0% → rising risk premium
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[70px] text-xs">
                        Regime:
                      </span>
                      <span className="text-foreground">Risk-on rotation</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Regime Components */}
              <Card className="bg-card border-border flex-1">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Regime Components
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vol Regime</span>
                      <span className="text-emerald-400 font-medium">Calm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Factor Regime
                      </span>
                      <span className="text-foreground">
                        Small-cap leadership
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Sector Regime
                      </span>
                      <span className="text-foreground">Cyclical tilt</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Liquidity Regime
                      </span>
                      <span className="text-foreground">Neutral</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-4 h-full">
              {/* Top Insight */}
              <Card className="bg-linear-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">
                    Top Insight
                  </h3>
                  <p className="text-sm text-foreground font-medium leading-relaxed">
                    IWM rose about 1.06%, making small-cap stocks the day's top
                    driver.
                  </p>
                </div>
              </Card>

              {/* Key Drivers */}
              <Card className="bg-card border-border flex-1">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Key Drivers
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span className="text-foreground leading-tight">
                        IWM rose about 1.06%, making small-cap stocks the day's
                        top driver.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span className="text-foreground leading-tight">
                        DIA climbed about 0.64%, helping large-cap value names.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span className="text-foreground leading-tight">
                        SPY was up about 0.18% overall, while QQQ fell about
                        -0.19%.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span className="text-foreground leading-tight">
                        XLE led sectors up about 2.10%, showing strong energy
                        gains.
                      </span>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => {
          return (
            <Card
              key={feature.title}
              className="p-6 transform hover:scale-102 transition-all duration-300 hover:bg-rose-500/10 hover:border-rose-500"
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

      {/* CTA */}
      <Card className="p-10 text-center border-rose-500/20">
        <h2 className="text-2xl font-bold mb-3">
          Ready to monitor the markets?
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Sign in to access daily Sentinel reports and market alerts
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors"
        >
          Sign In to Get Started
        </Link>
      </Card>
    </div>
  );
}
