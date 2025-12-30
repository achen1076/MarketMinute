import {
  AboutMarketMinuteInputSchema,
  AboutMarketMinuteOutputSchema,
  AboutMarketMinuteToolSpec,
  type AboutMarketMinuteInput,
  type AboutMarketMinuteOutput,
} from "@/shared/schemas/tools/aboutMarketMinute.schema";

const PLATFORM_INFO = {
  overview: `MarketMinute is a financial intelligence platform that combines real-time market data, AI-powered insights, and quantitative trading signals. Get instant market summaries, track custom watchlists, and leverage machine learning models for trading signals—all in one unified dashboard. The platform serves both active traders and long-term investors with concise insights across stocks, ETFs, and broader market trends.`,

  features: [
    {
      name: "Real-Time Market Data",
      description:
        "Live quotes, intraday price movements, and market summaries for stocks, ETFs, and major indices with instant updates.",
    },
    {
      name: "AI Chat Agent",
      description:
        "Ask questions about markets, watchlists, signals, news, and analysis in natural language. Get instant answers with access to all your data.",
    },
    {
      name: "QuantLab Signals",
      description:
        "Machine learning models generate BUY, SELL, or NEUTRAL signals with confidence scores. Predictions are adjusted in real-time based on breaking news sentiment and relevance to give you the most current analysis.",
    },
    {
      name: "Sentinel Intelligence",
      description:
        "AI-powered market analyst that monitors price action, volatility, and market events. Provides anomaly detection, sector rotation analysis, and plain English explanations of what's happening in the markets and why it matters.",
    },
    {
      name: "News & Events Analysis",
      description:
        "Curated financial news with AI-powered sentiment and relevance scoring. Automatically filters and prioritizes the most impactful news for each stock.",
    },
    {
      name: "Smart Alerts",
      description:
        "Automated notifications for price movements, volume spikes, sentiment changes, and trading signal updates. Get alerted to meaningful market events.",
    },
    {
      name: "Watchlist Management",
      description:
        "Create unlimited watchlists with drag-and-drop reordering, ticker search, and favorites. Set custom alerts on price changes and volume spikes.",
    },
    {
      name: "Distributional Forecasts",
      description:
        "Probabilistic price predictions with confidence intervals for 200+ tickers, updated daily after market close.",
    },
  ],

  quantlab: `QuantLab is MarketMinute's machine learning trading signal system that generates BUY, SELL, or NEUTRAL recommendations for stocks.

How it works:
- Models analyze 30 years of historical price data and technical indicators
- Signals are automatically adjusted based on breaking news sentiment
- Each signal includes a confidence score (0-100) and quality rating

Signal Quality Tiers:
- Best: Top-performing models with excellent historical accuracy
- Excellent: Strong performance, recommended for trading
- Good: Decent performance
- Low Quality: Poor historical performance, use with caution

Signals are updated daily after market close and adjusted throughout the day as major news breaks.`,

  sentinel: `Sentinel Intelligence is your AI-powered market analyst that monitors the markets 24/7 and explains what's happening in plain English.

What it does:
- Detects unusual market activity and volatility spikes
- Identifies sector rotation and emerging trends
- Explains market moves in simple, conversational language
- Provides "What This Means" summaries for each market event
- Tracks macro events and surprises

You get daily market briefings and can generate on-demand analysis anytime. Historical reports are saved so you can review past market events.`,

  pricing: `MarketMinute offers flexible pricing tiers:

Free Tier:
- Up to 3 QuantLab signals
- 2 watchlists with 20 tickers each
- All core features (market data, news, Sentinel, alerts)

Basic ($9.99/month):
- Full access to all QuantLab signals
- Unlimited watchlists and tickers
- Priority support

All tiers include AI Chat Agent, real-time market data, Sentinel analysis, news with sentiment scoring, and smart alerts.`,
};

export async function handleAboutMarketMinute(
  rawInput: unknown
): Promise<AboutMarketMinuteOutput> {
  const input: AboutMarketMinuteInput =
    AboutMarketMinuteInputSchema.parse(rawInput);

  const topic = input.topic || "all";

  const output: AboutMarketMinuteOutput = {};

  if (topic === "all" || topic === "overview") {
    output.overview = PLATFORM_INFO.overview;
  }
  if (topic === "all" || topic === "features") {
    output.features = PLATFORM_INFO.features;
  }
  if (topic === "all" || topic === "quantlab") {
    output.quantlab = PLATFORM_INFO.quantlab;
  }
  if (topic === "all" || topic === "sentinel") {
    output.sentinel = PLATFORM_INFO.sentinel;
  }
  if (topic === "all" || topic === "pricing") {
    output.pricing = PLATFORM_INFO.pricing;
  }

  AboutMarketMinuteOutputSchema.parse(output);
  return output;
}

export const aboutMarketMinuteTool = {
  ...AboutMarketMinuteToolSpec,
  handler: handleAboutMarketMinute,
} as const;
