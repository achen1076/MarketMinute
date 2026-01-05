export type ModelQuality = {
  sharpe_ratio: number;
  profit_factor: number | null;
  win_rate: number;
  num_trades: number;
  max_drawdown: number;
  deployable: boolean;
  quality_tier: "excellent" | "good" | "marginal" | "neutral" | "poor";
};

export type Prediction = {
  ticker: string;
  timestamp: string;
  current_price: number;
  raw_signal?: "BUY" | "SELL" | "NEUTRAL";
  raw_confidence?: number;
  raw_prob_up?: number;
  raw_prob_neutral?: number;
  raw_prob_down?: number;
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
  // Model quality metrics
  model_quality?: ModelQuality;
};

export type EnhancedSignal = Prediction & {
  quantScore: number;
  rawQuantScore: number | null;
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
