import type { Prediction, EnhancedSignal } from "@/types/quant";

function calculateQuantScore(
  prob_up: number,
  prob_down: number,
  prob_neutral: number,
  confidence: number
): number {
  const edge = Math.abs(prob_up - prob_down);
  const trendFactor = 1 - prob_neutral;
  const directionStrength = Math.max(prob_up, prob_down);

  const EDGE_WEIGHT = 70;
  const TREND_WEIGHT = 40;
  const DIR_WEIGHT = 30;
  const CONF_WEIGHT = 15;

  let score =
    edge * EDGE_WEIGHT +
    trendFactor * TREND_WEIGHT +
    directionStrength * DIR_WEIGHT +
    confidence * CONF_WEIGHT;

  // Regime adjustments
  const regime = (() => {
    if (prob_neutral > 0.85) return "low-vol chop";
    if (edge > 0.15 && confidence > 0.7) return "trending";
    if (edge > 0.1) return "high-vol breakout";
    if (edge < 0.05) return "reverting";
    return "mixed";
  })();

  if (regime === "trending") score *= 1.08;
  if (regime === "high-vol breakout") score *= 1.12;
  if (regime === "low-vol chop") score *= 0.75;
  if (regime === "reverting") score *= 0.9;

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function calculateSignalMetrics(pred: Prediction): EnhancedSignal {
  const {
    prob_up,
    prob_down,
    prob_neutral,
    confidence,
    atr,
    current_price,
    signal,
    raw_prob_up,
    raw_prob_down,
    raw_prob_neutral,
    raw_confidence,
  } = pred;

  const edge = Math.abs(prob_up - prob_down);
  const edgeDirectional = prob_up - prob_down;
  const directionalBias =
    prob_up > prob_down ? prob_up - prob_down : -(prob_down - prob_up);

  // Calculate directional confidence (confidence in the actual prediction)
  const directionalConfidence =
    signal === "BUY" ? prob_up : signal === "SELL" ? prob_down : prob_neutral;

  // Convert ATR from dollars to percentage of current price
  const volatility = atr ? atr / current_price : 0.02;

  const expectedReturn = directionalBias * volatility;
  const expectedVolatility = volatility * (1 + edge);

  const regime = (() => {
    if (prob_neutral > 0.85) return "low-vol chop";
    if (edge > 0.15 && confidence > 0.7) return "trending";
    if (edge > 0.1 && volatility > 0.03) return "high-vol breakout";
    if (edge < 0.05) return "reverting";
    return "mixed";
  })();

  const prob1PctMove = prob_up + prob_down;
  const prob2PctMove = Math.max(0, (prob_up + prob_down) * 0.7);

  // Calculate quant scores
  const quantScore = calculateQuantScore(
    prob_up,
    prob_down,
    prob_neutral,
    confidence
  );

  // Calculate raw quant score if raw fields exist
  const rawQuantScore =
    raw_prob_up !== undefined &&
    raw_prob_down !== undefined &&
    raw_prob_neutral !== undefined &&
    raw_confidence !== undefined
      ? calculateQuantScore(
          raw_prob_up,
          raw_prob_down,
          raw_prob_neutral,
          raw_confidence
        )
      : null;

  const signalDescription = (() => {
    if (quantScore >= 70) {
      return `Strong ${directionalBias > 0 ? "Bullish" : "Bearish"} Edge (+${(
        Math.abs(expectedReturn) * 100
      ).toFixed(2)}%) — ${regime}`;
    } else if (quantScore >= 50) {
      return `${
        directionalBias > 0 ? "Bullish" : "Bearish"
      } Bias — ${regime} regime`;
    } else if (quantScore >= 30) {
      return `Weak ${
        directionalBias > 0 ? "bullish" : "bearish"
      } lean — ${regime}`;
    } else {
      return `Neutral — ${regime}`;
    }
  })();

  const tradingInterpretation = (() => {
    if (quantScore >= 70 && edge > 0.15) {
      return "The model detects a strong statistical edge with high internal confidence.";
    } else if (quantScore >= 60 && regime === "trending") {
      return "The model identifies a clear trend within the current regime.";
    } else if (quantScore >= 50 && regime === "high-vol breakout") {
      return "The model detects elevated volatility with a potential directional bias.";
    } else if (quantScore >= 40) {
      return "The model finds a moderate edge but not a strong directional signal.";
    } else if (quantScore >= 30 && volatility < 0.015) {
      return `The model notes a weak ${
        directionalBias > 0 ? "bullish" : "bearish"
      } leaning, while overall volatility remains low.`;
    } else if (quantScore >= 25 && regime === "reverting") {
      return "The model identifies a reverting regime with limited directional structure.";
    } else if (regime === "low-vol chop") {
      return "The model characterizes conditions as low volatility with limited structure.";
    } else if (edge < 0.03) {
      return "The model does not detect a meaningful statistical edge.";
    } else {
      return "The model shows mixed or low conviction signals.";
    }
  })();

  const isTradeable = quantScore >= 35 && edge > 0.05;

  return {
    ...pred,
    quantScore,
    rawQuantScore,
    edge,
    edgeDirectional,
    regime,
    expectedReturn,
    expectedVolatility,
    prob1PctMove,
    prob2PctMove,
    directionalConfidence,
    signalDescription,
    tradingInterpretation,
    isTradeable,
  };
}
