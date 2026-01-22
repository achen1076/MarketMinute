// ============================================
// INSTITUTIONAL-GRADE NARRATIVE OUTPUT GENERATOR
// Produces explicit, decision-relevant explanations
// No rambling - every field has a purpose
// ============================================

import type {
  PriceMove,
  ExpectationBaseline,
  ExpectationGap,
  SecondOrderAttribution,
  NarrativeOutput,
  MoveClassification,
} from "../types";

/**
 * Determine confidence level based on classification confidence
 */
function determineConfidence(gap: ExpectationGap): "high" | "medium" | "low" {
  // Stricter thresholds for confidence calibration
  if (gap.classificationConfidence >= 0.75) return "high";
  if (gap.classificationConfidence >= 0.55) return "medium";
  return "low";
}

/**
 * Format the move string with explicit expectation source
 */
function formatMoveString(
  priceMove: PriceMove,
  gap: ExpectationGap,
  baseline: ExpectationBaseline
): string {
  const sign = priceMove.changePct >= 0 ? "+" : "";
  const move = `${sign}${priceMove.changePct.toFixed(2)}%`;

  // Determine expectation source label
  let sourceLabel: string;
  if (baseline.impliedMove) {
    sourceLabel = "options-implied, front expiry";
  } else if (baseline.iv30) {
    sourceLabel = "30D IV-derived";
  } else {
    sourceLabel = "model-implied";
  }

  return `${move} (vs ±${gap.expectedMove.toFixed(1)}% ${sourceLabel})`;
}

/**
 * Format relative performance with dispersion context
 */
function formatRelativeMove(
  priceMove: PriceMove,
  secondOrder: SecondOrderAttribution
): string {
  if (secondOrder.sectorMove === undefined || !secondOrder.sectorEtf) {
    return "No sector benchmark available";
  }

  const diff = priceMove.changePct - secondOrder.sectorMove;
  const absDiff = Math.abs(diff);

  // Determine if relative move is within historical dispersion
  // Typical stock-vs-sector dispersion is ~1-2%
  const dispersionContext =
    absDiff < 1.5
      ? "within historical dispersion"
      : absDiff < 3
      ? "notable relative strength"
      : "significant idiosyncratic move";

  // Better wording for performance vs sector
  let performanceLabel: string;
  if (absDiff < 0.5) {
    performanceLabel = "In line with";
  } else if (diff > 0) {
    performanceLabel =
      absDiff < 1.5 ? "Modest outperformance vs" : "Strong outperformance vs";
  } else {
    performanceLabel =
      absDiff < 1.5
        ? "Modest underperformance vs"
        : "Significant underperformance vs";
  }

  return `${performanceLabel} ${secondOrder.sectorEtf}, ${dispersionContext}`;
}

/**
 * Generate explicit expectation source
 */
function buildExpectationSource(
  gap: ExpectationGap,
  baseline: ExpectationBaseline
): string {
  if (baseline.impliedMove) {
    // Options-based expectation - clearer wording
    const percentile =
      baseline.ivPercentile ||
      Math.min(95, Math.max(50, Math.round(gap.moveGapRatio * 50 + 50)));
    const pctileLabel = percentile === 50 ? "median" : `${percentile}th pctile`;
    return `1D options implied move (${pctileLabel}, front expiry)`;
  } else if (baseline.iv30) {
    return `30D implied volatility (${(baseline.iv30 * 100).toFixed(
      0
    )}% annualized)`;
  } else {
    return `Composite expectation (sector-adjusted historical)`;
  }
}

/**
 * Generate primary read with quant evidence
 */
function buildPrimaryRead(
  priceMove: PriceMove,
  gap: ExpectationGap,
  secondOrder: SecondOrderAttribution
): string {
  const sigma =
    gap.moveGapRatio < 1 ? "<1σ" : gap.moveGapRatio < 2 ? "~1σ" : ">2σ";
  const classification = gap.classification;

  switch (classification) {
    case "fundamental":
      return `Move driven by fundamental catalyst with ${sigma} magnitude. News sentiment ${
        gap.sentimentMoveAlignment === "aligned" ? "confirms" : "diverges from"
      } price action.`;

    case "macro":
      const driver = secondOrder.primaryDriver || "broad market forces";
      return `Move explained by ${driver} (${sigma}). Stock tracking sector with minimal idiosyncratic component.`;

    case "positioning":
      return `Flow-driven move within normal volatility regime (${sigma}). No fundamental repricing detected.`;

    case "narrative":
      return `Sentiment-driven move (${sigma}) without fundamental confirmation. Narrative active but unverified.`;

    case "noise":
      return `Move within normal volatility regime (${sigma}) with no ${priceMove.symbol}-specific fundamental update.`;

    default:
      return `Move magnitude: ${sigma}. Classification confidence: ${(
        gap.classificationConfidence * 100
      ).toFixed(0)}%.`;
  }
}

/**
 * Generate catalyst check with explicit downgrading
 */
function buildCatalystCheck(gap: ExpectationGap, priceMove: PriceMove): string {
  if (gap.fundamentalNews && gap.fundamentalDelta) {
    // There is a catalyst - evaluate its quality
    if (gap.classification === "fundamental") {
      return `Catalyst confirmed: ${gap.fundamentalDelta.slice(
        0,
        60
      )}. Material to ${priceMove.symbol} outlook.`;
    } else if (gap.classification === "narrative") {
      return `Narrative catalyst surfaced but lacked novelty or ${priceMove.symbol}-specific confirmation.`;
    } else {
      return `Media commentary noted but discounted — no material ${priceMove.symbol} fundamental change.`;
    }
  } else {
    // No catalyst
    if (gap.classification === "noise") {
      return `No catalyst identified. Move appears to be normal market fluctuation.`;
    } else if (gap.classification === "macro") {
      return `No stock-specific catalyst. Move attributed to sector/macro forces.`;
    } else {
      return `No earnings, guidance, or material announcement detected.`;
    }
  }
}

/**
 * Generate second-order effects
 */
function buildSecondOrderEffects(
  secondOrder: SecondOrderAttribution
): string[] {
  const effects: string[] = [];

  // Sector ETF with context
  if (secondOrder.sectorEtf && secondOrder.sectorMove !== undefined) {
    const sectorContext =
      Math.abs(secondOrder.sectorMove) > 1.5 ? " (notable)" : "";
    effects.push(
      `${secondOrder.sectorEtf} ${
        secondOrder.sectorMove >= 0 ? "+" : ""
      }${secondOrder.sectorMove.toFixed(1)}%${sectorContext}`
    );
  }

  // Add market indices for context (SPY or QQQ based on relevance)
  const marketIndices = secondOrder.macroFactors.filter(
    (f) => f.factor === "SPY" || f.factor === "QQQ"
  );
  marketIndices.forEach((idx) => {
    effects.push(
      `${idx.factor} ${idx.move >= 0 ? "+" : ""}${idx.move.toFixed(1)}%`
    );
  });

  // Top correlated tickers with leadership context
  secondOrder.correlatedTickers.slice(0, 2).forEach((t) => {
    const leadership =
      Math.abs(t.move) > 2.5
        ? t.move > 0
          ? " led strength"
          : " led weakness"
        : "";
    effects.push(
      `${t.symbol} ${t.move >= 0 ? "+" : ""}${t.move.toFixed(1)}%${leadership}`
    );
  });

  // Significant macro factors
  const significantMacro = secondOrder.macroFactors.filter(
    (f) => Math.abs(f.move) > 0.3
  );
  if (significantMacro.length > 0) {
    const macro = significantMacro[0];
    effects.push(
      `${macro.factor} ${macro.move >= 0 ? "+" : ""}${macro.move.toFixed(
        2
      )}% (${macro.impact})`
    );
  }

  return effects;
}

/**
 * Generate hard invalidation trigger
 */
function buildInvalidation(
  priceMove: PriceMove,
  gap: ExpectationGap,
  secondOrder: SecondOrderAttribution
): string {
  const symbol = priceMove.symbol;
  const direction = priceMove.changePct > 0 ? "outperforms" : "underperforms";
  const oppositeDirection =
    priceMove.changePct > 0 ? "underperforms" : "outperforms";

  switch (gap.classification) {
    case "fundamental":
      return `Breaks if ${symbol} fully reverses on no new information within 2 sessions.`;

    case "macro":
      return `Breaks if ${symbol} ${oppositeDirection} sector tomorrow without stock-specific news.`;

    case "positioning":
      return `Breaks if volume remains elevated with continued directional pressure.`;

    case "narrative":
      return `Breaks if ${symbol} ${direction} ${
        secondOrder.sectorEtf || "peers"
      } again tomorrow without sector support.`;

    case "noise":
      return `Breaks if pattern persists 3+ days or ${symbol} moves >2σ from here.`;

    default:
      return `Breaks if classification-contradicting evidence emerges.`;
  }
}

/**
 * Generate decision implication (without advice)
 */
function buildDecisionImplication(
  gap: ExpectationGap,
  priceMove: PriceMove
): string {
  switch (gap.classification) {
    case "fundamental":
      if (gap.classificationConfidence >= 0.8) {
        return `Fundamental re-rating in progress. Position review warranted.`;
      }
      return `Potential fundamental shift. Monitor for confirmation before action.`;

    case "macro":
      return `Sector-driven move. No ${priceMove.symbol}-specific action warranted unless thesis changes.`;

    case "positioning":
      return `Flow-driven volatility. No fundamental action warranted.`;

    case "narrative":
      return `Narrative-driven move without fundamental backing. Caution on chasing.`;

    case "noise":
      return `No portfolio action warranted absent follow-through.`;

    default:
      return `Classification uncertain. Additional monitoring recommended.`;
  }
}

/**
 * Format classification for display
 */
function formatClassification(classification: MoveClassification): string {
  return classification.charAt(0).toUpperCase() + classification.slice(1);
}

/**
 * Generate complete institutional-grade narrative output
 */
export function generateNarrative(
  priceMove: PriceMove,
  baseline: ExpectationBaseline,
  gap: ExpectationGap,
  secondOrder: SecondOrderAttribution
): NarrativeOutput {
  return {
    // Header
    ticker: priceMove.symbol,
    classification: formatClassification(gap.classification),
    move: formatMoveString(priceMove, gap, baseline),
    relative: formatRelativeMove(priceMove, secondOrder),
    confidence: determineConfidence(gap),
    timeHorizon: "1D reaction",

    // Explicit expectation source
    expectationSource: buildExpectationSource(gap, baseline),

    // Primary read with quant evidence
    primaryRead: buildPrimaryRead(priceMove, gap, secondOrder),

    // Catalyst check with explicit downgrade
    catalystCheck: buildCatalystCheck(gap, priceMove),

    // Second-order effects
    secondOrderEffects: buildSecondOrderEffects(secondOrder),

    // Hard invalidation trigger
    invalidation: buildInvalidation(priceMove, gap, secondOrder),

    // Decision implication
    decisionImplication: buildDecisionImplication(gap, priceMove),

    generatedAt: new Date().toISOString(),
  };
}
