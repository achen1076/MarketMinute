import {
  AboutMarketMinuteInputSchema,
  AboutMarketMinuteOutputSchema,
  AboutMarketMinuteToolSpec,
  type AboutMarketMinuteInput,
  type AboutMarketMinuteOutput,
} from "@/shared/schemas/tools/aboutMarketMinute.schema";

const PLATFORM_INFO = {
  overview: `MarketMinute is an AI-powered market intelligence platform that helps traders and investors make informed decisions. It combines real-time market data, AI-generated insights, machine learning predictions, and personalized briefings to provide a comprehensive view of the markets.`,

  features: [
    {
      name: "Real-time Market Data",
      description:
        "Live quotes, price movements, and market summaries for stocks, ETFs, and indices.",
    },
    {
      name: "QuantLab ML Predictions",
      description:
        "Machine learning models that generate BUY/SELL/NEUTRAL signals with confidence scores and quality ratings.",
    },
    {
      name: "Sentinel AI Briefings",
      description:
        "Personalized daily market briefings powered by AI, analyzing your watchlist and market conditions.",
    },
    {
      name: "News & Events",
      description:
        "Curated financial news with AI-powered sentiment analysis and relevance scoring.",
    },
    {
      name: "Smart Alerts",
      description:
        "Customizable alerts for price movements, sentiment changes, and trading signals.",
    },
    {
      name: "Watchlists",
      description:
        "Create and manage multiple watchlists to track your favorite stocks.",
    },
  ],

  quantlab: `QuantLab is MarketMinute's ML-powered trading signal system. It uses LightGBM models trained on technical indicators and market data to predict 10-day forward returns.

Key Metrics:
- Quant Score (0-100): Overall signal strength
- Quality Tiers: Best, Excellent, Good, Low Quality based on Sharpe Ratio and Profit Factor
- Deployable Models: Models with Sharpe > 1 and Profit Factor > 1.5 are recommended for trading

The system retrains models regularly and updates quality ratings based on backtested performance.`,

  sentinel: `Sentinel is MarketMinute's AI-powered market briefing system. It generates personalized daily summaries analyzing:
- Your watchlist performance
- Key market movements
- Relevant news and events
- Trading opportunities from QuantLab signals

Briefings are delivered in your preferred format (detailed, concise, or bullet points) and can focus on specific aspects like technicals, news, or signals.`,

  pricing: `MarketMinute offers three tiers:
- Free: Limited access to basic features, 3 signals, 1 watchlist
- Basic ($9.99/mo): Full access to all signals for your watchlist, unlimited watchlists
- Pro ($24.99/mo): Everything in Basic plus Sentinel AI briefings, priority support`,
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
