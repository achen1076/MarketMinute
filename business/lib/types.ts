// ============================================
// EXPECTATION GAP ENGINE - Core Types
// ============================================

/**
 * Move Classification Categories
 * Classifies what's driving a price move
 */
export type MoveClassification =
  | "fundamental" // Earnings beat/miss, guidance change, M&A
  | "narrative" // News/sentiment without fundamental change
  | "positioning" // Flows, de-risking, rebalancing
  | "macro" // Rates, USD, oil, sector rotation
  | "noise"; // No clear driver, mean-reversion candidate

/**
 * Move Detection Trigger
 * What caused us to analyze this stock
 */
export type MoveTrigger =
  | "price_move" // Significant % move
  | "volume_spike" // Abnormal volume
  | "earnings_event" // Earnings release
  | "macro_event" // Fed, CPI, etc.
  | "correlation_spike" // Unusual correlation behavior
  | "manual"; // User requested

/**
 * Price Move Data
 * Raw price movement information
 */
export interface PriceMove {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number; // volume / avgVolume
  timestamp: string;
  intradayHigh: number;
  intradayLow: number;
  intradayRange: number; // (high - low) / previousClose
}

/**
 * Expectation Baseline
 * What the market "expected" before the move
 */
export interface ExpectationBaseline {
  symbol: string;

  // Consensus Estimates
  consensusEps?: number; // Current quarter EPS estimate
  consensusRevenue?: number; // Current quarter revenue estimate
  epsGrowthEstimate?: number; // YoY EPS growth estimate %
  revenueGrowthEstimate?: number; // YoY revenue growth estimate %

  // Prior Guidance
  priorGuidanceEps?: { low: number; high: number };
  priorGuidanceRevenue?: { low: number; high: number };

  // Historical Reaction Patterns
  avgEarningsMove?: number; // Average absolute move on earnings
  avgBeatReaction?: number; // Average move on beat
  avgMissReaction?: number; // Average move on miss

  // Options Implied Move
  impliedMove?: number; // Options-implied expected move %
  iv30?: number; // 30-day implied volatility
  ivPercentile?: number; // IV percentile (0-100)

  // Model-Implied Fair Value (rough)
  modelFairValue?: number;
  modelUpside?: number; // % upside to fair value

  // Analyst Targets
  analystTargetMean?: number;
  analystTargetHigh?: number;
  analystTargetLow?: number;
  analystRatingScore?: number; // 1-5 (1=sell, 5=buy)

  lastUpdated: string;
}

/**
 * Expectation Gap
 * The core analysis: actual vs expected
 */
export interface ExpectationGap {
  // Move Analysis
  actualMove: number; // Actual % move
  expectedMove: number; // Expected % move (from options or historical)
  moveGap: number; // actualMove - expectedMove
  moveGapRatio: number; // actualMove / expectedMove

  // Sentiment Analysis
  newsSentiment?: number; // -1 to 1
  sentimentMoveAlignment?: "aligned" | "divergent" | "neutral";

  // Fundamental Delta
  fundamentalNews: boolean; // Was there fundamental news?
  fundamentalDelta?: string; // Description of fundamental change

  // Classification
  classification: MoveClassification;
  classificationConfidence: number; // 0-1

  // Supporting Evidence
  evidencePoints: string[];
}

/**
 * Second-Order Attribution
 * What else is moving and why it matters
 */
export interface SecondOrderAttribution {
  // Sector Analysis
  sectorEtf?: string; // e.g., "XLK"
  sectorMove?: number; // Sector ETF move %
  sectorCorrelation?: number; // Stock's correlation to sector today

  // Correlated Movers
  correlatedTickers: {
    symbol: string;
    move: number;
    correlation: number;
  }[];

  // Macro Factors
  macroFactors: {
    factor: string; // e.g., "10Y Yield", "DXY", "Oil"
    move: number;
    impact: "positive" | "negative" | "neutral";
  }[];

  // Attribution Summary
  isIdiosyncratic: boolean; // True if move is stock-specific
  primaryDriver?: string; // e.g., "sector de-risking", "rates"
}

/**
 * Narrative Output
 * Institutional-grade analyst explanation
 * Follows strict template with explicit trust layers
 */
export interface NarrativeOutput {
  // === HEADER ===
  ticker: string;
  classification: string; // "Noise", "Fundamental", etc.
  move: string; // e.g., "+0.7% (vs ±1.6% options-implied, front expiry)"
  relative: string; // e.g., "+0.6% vs XLK, within historical dispersion"
  confidence: "high" | "medium" | "low";
  timeHorizon: string; // e.g., "1D reaction"

  // === EXPLICIT EXPECTATION SOURCE ===
  expectationSource: string; // e.g., "1D options implied move (85th pctile, front expiry)"

  // === PRIMARY READ ===
  // Core explanation with quant evidence reference
  primaryRead: string;

  // === CATALYST CHECK ===
  // Explicit downgrade of weak catalysts
  catalystCheck: string;

  // === SECOND-ORDER EFFECTS ===
  secondOrderEffects: string[];

  // === INVALIDATION ===
  // Hard rule that breaks the thesis
  invalidation: string;

  // === DECISION IMPLICATION ===
  // What this means for portfolio action (without advice)
  decisionImplication: string;

  // Generated Timestamp
  generatedAt: string;
}

/**
 * Full Expectation Gap Analysis
 * The complete output of the engine
 */
export interface ExpectationGapAnalysis {
  symbol: string;
  trigger: MoveTrigger;
  priceMove: PriceMove;
  baseline: ExpectationBaseline;
  gap: ExpectationGap;
  secondOrder: SecondOrderAttribution;
  narrative: NarrativeOutput;
  analysisId: string;
  createdAt: string;
}

/**
 * Move Detection Config
 * Thresholds for triggering analysis
 */
export interface MoveDetectionConfig {
  priceMovePctThreshold: number; // e.g., 2.0 for ±2%
  volumeRatioThreshold: number; // e.g., 2.0 for 2x avg volume
  correlationSpikeThreshold: number; // e.g., 0.3 for unusual correlation
}

/**
 * Sector Mapping
 */
export const SECTOR_ETFS: Record<string, string> = {
  Technology: "XLK",
  Healthcare: "XLV",
  Financials: "XLF",
  "Consumer Discretionary": "XLY",
  "Consumer Staples": "XLP",
  Energy: "XLE",
  Industrials: "XLI",
  Materials: "XLB",
  Utilities: "XLU",
  "Real Estate": "XLRE",
  "Communication Services": "XLC",
};

/**
 * Macro Factors to Track
 */
export const MACRO_FACTORS = [
  { symbol: "^TNX", name: "10Y Yield", type: "rates" },
  { symbol: "DX-Y.NYB", name: "US Dollar (DXY)", type: "currency" },
  { symbol: "CL=F", name: "Crude Oil", type: "commodity" },
  { symbol: "GC=F", name: "Gold", type: "commodity" },
  { symbol: "^VIX", name: "VIX", type: "volatility" },
] as const;
