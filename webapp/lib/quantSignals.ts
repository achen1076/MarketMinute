import type { Prediction, EnhancedSignal } from "@/types/quant";

export function calculateSignalMetrics(pred: Prediction): EnhancedSignal {
  const {
    prob_up,
    prob_down,
    prob_neutral,
    confidence,
    atr,
    current_price,
    signal,
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

  const trendFactor = 1 - prob_neutral;
  const directionStrength = Math.max(prob_up, prob_down);

  const EDGE_WEIGHT = 70;
  const TREND_WEIGHT = 40;
  const DIR_WEIGHT = 30;
  const CONF_WEIGHT = 15;

  let quantScore =
    edge * EDGE_WEIGHT +
    trendFactor * TREND_WEIGHT +
    directionStrength * DIR_WEIGHT +
    confidence * CONF_WEIGHT;

  if (regime === "trending") quantScore *= 1.08;
  if (regime === "high-vol breakout") quantScore *= 1.12;
  if (regime === "low-vol chop") quantScore *= 0.75;
  if (regime === "reverting") quantScore *= 0.9;

  quantScore = Math.min(100, Math.max(0, quantScore));
  quantScore = Math.round(quantScore);

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
      return "Strong statistical edge detected — highest conviction setup.";
    } else if (quantScore >= 60 && regime === "trending") {
      return "Clear directional momentum — favored for trend-following strategies.";
    } else if (quantScore >= 50 && regime === "high-vol breakout") {
      return "Elevated volatility with directional bias — suitable for active monitoring.";
    } else if (quantScore >= 40) {
      return "Modest edge present, but requires confirmation from other analysis tools.";
    } else if (quantScore >= 30 && volatility < 0.015) {
      return `Weak ${
        directionalBias > 0 ? "bullish" : "bearish"
      } lean, but low volatility dampens conviction.`;
    } else if (quantScore >= 25 && regime === "reverting") {
      return "Mean-reversion setup detected — consider waiting for clearer signals.";
    } else if (regime === "low-vol chop") {
      return "Model sees low/neutral chop — intraday traders may prefer to wait.";
    } else if (edge < 0.03) {
      return "No clear edge — staying on sidelines recommended.";
    } else {
      return "Mixed signals with low conviction — better opportunities likely elsewhere.";
    }
  })();

  const isTradeable = quantScore >= 35 && edge > 0.05;

  return {
    ...pred,
    quantScore,
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
