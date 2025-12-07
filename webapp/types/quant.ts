export type Prediction = {
  ticker: string;
  timestamp: string;
  current_price: number;
  // Raw model outputs (before news adjustment)
  raw_signal?: "BUY" | "SELL" | "NEUTRAL";
  raw_confidence?: number;
  raw_prob_up?: number;
  raw_prob_neutral?: number;
  raw_prob_down?: number;
  // News-adjusted outputs (after Bayesian update)
  signal: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  prob_up: number;
  prob_neutral: number;
  prob_down: number;
  news_count?: number;
  should_trade: boolean;
  take_profit: number | null;
  stop_loss: number | null;
  atr: number;
};

export type EnhancedSignal = Prediction & {
  quantScore: number;
  edge: number;
  edgeDirectional: number;
  regime: string;
  expectedReturn: number;
  expectedVolatility: number;
  prob1PctMove: number;
  prob2PctMove: number;
  directionalConfidence: number;
  signalDescription: string;
  tradingInterpretation: string;
  isTradeable: boolean;
};

export type DistributionalForecast = {
  ticker: string;
  current_price: number;
  timestamp: string;
  expected_range_pct: number;
  upper_bound: number;
  lower_bound: number;
  directional_bias: "Bullish" | "Bearish" | "Neutral";
  conviction: "Low" | "Medium" | "High";
  conviction_score: number;
  most_likely_category:
    | "large_up"
    | "mild_up"
    | "flat"
    | "mild_down"
    | "large_down";
  prob_large_up: number;
  prob_mild_up: number;
  prob_flat: number;
  prob_mild_down: number;
  prob_large_down: number;
  p10: number;
  p50: number;
  p90: number;
};
