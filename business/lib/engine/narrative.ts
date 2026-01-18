// ============================================
// NARRATIVE OUTPUT GENERATOR
// Produces analyst-style structured explanations
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
 * Generate the headline (the hook)
 */
function generateHeadline(
  priceMove: PriceMove,
  gap: ExpectationGap,
  secondOrder: SecondOrderAttribution
): string {
  const direction = priceMove.changePct > 0 ? "up" : "down";
  const absMove = Math.abs(priceMove.changePct).toFixed(1);
  const symbol = priceMove.symbol;

  switch (gap.classification) {
    case "fundamental":
      return `${symbol} ${direction} ${absMove}% on fundamental news`;

    case "macro":
      return `${symbol} ${direction} ${absMove}% amid ${
        secondOrder.primaryDriver || "broad market moves"
      }`;

    case "positioning":
      if (priceMove.volumeRatio > 2) {
        return `${symbol} ${direction} ${absMove}% on heavy volume (${priceMove.volumeRatio.toFixed(
          1
        )}x avg)`;
      }
      return `${symbol} ${direction} ${absMove}% on positioning shift`;

    case "narrative":
      return `${symbol} ${direction} ${absMove}% on sentiment, not fundamentals`;

    case "noise":
      return `${symbol} ${direction} ${absMove}% — no clear catalyst`;

    default:
      return `${symbol} ${direction} ${absMove}%`;
  }
}

/**
 * Generate "What Happened" section
 */
function generateWhatHappened(
  priceMove: PriceMove,
  gap: ExpectationGap,
  baseline: ExpectationBaseline
): string {
  const parts: string[] = [];

  // Price action
  const direction = priceMove.changePct > 0 ? "rose" : "fell";
  parts.push(
    `${priceMove.symbol} ${direction} ${Math.abs(priceMove.changePct).toFixed(
      2
    )}% to $${priceMove.currentPrice.toFixed(2)}.`
  );

  // Volume context
  if (priceMove.volumeRatio > 1.5) {
    parts.push(
      `Volume was ${priceMove.volumeRatio.toFixed(1)}x the 20-day average.`
    );
  } else if (priceMove.volumeRatio < 0.7) {
    parts.push(
      `Volume was light at ${(priceMove.volumeRatio * 100).toFixed(
        0
      )}% of average.`
    );
  }

  // Expected vs actual
  if (gap.moveGapRatio > 1.5) {
    parts.push(
      `The move exceeded the expected ${gap.expectedMove.toFixed(
        1
      )}% daily range by ${gap.moveGapRatio.toFixed(1)}x.`
    );
  } else if (gap.moveGapRatio < 0.7) {
    parts.push(
      `The move was within normal range (expected: ±${gap.expectedMove.toFixed(
        1
      )}%).`
    );
  }

  // Fundamental news if present
  if (gap.fundamentalNews && gap.fundamentalDelta) {
    parts.push(
      `Key catalyst: "${gap.fundamentalDelta.slice(0, 100)}${
        gap.fundamentalDelta.length > 100 ? "..." : ""
      }"`
    );
  }

  return parts.join(" ");
}

/**
 * Generate "Why" section based on classification
 */
function generateWhy(
  gap: ExpectationGap,
  secondOrder: SecondOrderAttribution
): string {
  const parts: string[] = [];

  switch (gap.classification) {
    case "fundamental":
      parts.push("This appears to be a fundamentally-driven move.");
      if (gap.sentimentMoveAlignment === "aligned") {
        parts.push(
          "News sentiment aligns with price action, suggesting the market is pricing in new information."
        );
      } else if (gap.sentimentMoveAlignment === "divergent") {
        parts.push(
          "⚠️ Note: Price direction diverges from news sentiment — watch for reversal."
        );
      }
      break;

    case "macro":
      parts.push(
        "This move appears driven by broader market forces, not stock-specific news."
      );
      if (secondOrder.sectorMove !== undefined) {
        parts.push(
          `The sector ETF (${secondOrder.sectorEtf}) moved ${
            secondOrder.sectorMove > 0 ? "+" : ""
          }${secondOrder.sectorMove.toFixed(2)}%.`
        );
      }
      if (secondOrder.primaryDriver) {
        parts.push(`Primary driver: ${secondOrder.primaryDriver}.`);
      }
      break;

    case "positioning":
      parts.push(
        "This looks like a positioning/flow-driven move rather than a fundamental re-rating."
      );
      if (
        !secondOrder.isIdiosyncratic &&
        secondOrder.correlatedTickers.length > 0
      ) {
        const peers = secondOrder.correlatedTickers
          .slice(0, 2)
          .map(
            (t) => `${t.symbol} (${t.move > 0 ? "+" : ""}${t.move.toFixed(1)}%)`
          )
          .join(", ");
        parts.push(`Sector peers also moved: ${peers}.`);
      }
      parts.push(
        "Possible causes: fund rebalancing, ETF flows, or de-risking."
      );
      break;

    case "narrative":
      parts.push(
        "The market is reacting to narrative/sentiment, not fundamental changes."
      );
      parts.push(
        "No material change to earnings, guidance, or business outlook detected."
      );
      if (gap.sentimentMoveAlignment === "divergent") {
        parts.push(
          "⚠️ Price diverging from sentiment — potential mean-reversion opportunity."
        );
      }
      break;

    case "noise":
      parts.push("No significant catalyst identified.");
      parts.push("This appears to be normal market noise / random walk.");
      parts.push("The move is within historical volatility ranges.");
      break;
  }

  // Add macro context if relevant
  const significantMacro = secondOrder.macroFactors.filter(
    (f) => Math.abs(f.move) > 0.5
  );
  if (significantMacro.length > 0 && gap.classification !== "macro") {
    const macroContext = significantMacro
      .slice(0, 2)
      .map((f) => `${f.factor} ${f.move > 0 ? "+" : ""}${f.move.toFixed(2)}%`)
      .join(", ");
    parts.push(`Macro backdrop: ${macroContext}.`);
  }

  return parts.join(" ");
}

/**
 * Generate "What Matters Next" section
 */
function generateWhatMattersNext(
  priceMove: PriceMove,
  gap: ExpectationGap,
  baseline: ExpectationBaseline,
  secondOrder: SecondOrderAttribution
): string {
  const parts: string[] = [];

  switch (gap.classification) {
    case "fundamental":
      parts.push("Watch for:");
      parts.push("• Follow-through in next 2-3 sessions to confirm new range");
      parts.push("• Analyst revisions to price targets and estimates");
      if (baseline.consensusEps) {
        parts.push("• Updated forward guidance if this was earnings-related");
      }
      break;

    case "macro":
      parts.push("Key factors to monitor:");
      if (secondOrder.primaryDriver) {
        parts.push(`• ${secondOrder.primaryDriver} trajectory`);
      }
      parts.push("• Sector rotation signals and ETF flows");
      parts.push("• Correlation to break if stock-specific news emerges");
      break;

    case "positioning":
      parts.push("Watch for:");
      parts.push("• Volume normalization in coming sessions");
      parts.push("• Institutional 13F filings for position changes");
      parts.push("• Potential mean-reversion if no fundamental catalyst");
      break;

    case "narrative":
      parts.push("Key considerations:");
      parts.push("• Narratives can be self-fulfilling short-term");
      parts.push("• Watch for fundamental confirmation or denial");
      parts.push(
        "• Consider fading if move extends beyond 2 standard deviations"
      );
      break;

    case "noise":
      parts.push("Low-conviction move. Consider:");
      parts.push("• Ignoring unless pattern persists 3+ days");
      parts.push(
        "• Checking for hidden catalysts (insider buying, dark pool activity)"
      );
      parts.push("• Mean-reversion strategies if technical levels broken");
      break;
  }

  return parts.join("\n");
}

/**
 * Generate invalidation thesis
 */
function generateInvalidation(
  priceMove: PriceMove,
  gap: ExpectationGap,
  baseline: ExpectationBaseline
): string {
  const direction = priceMove.changePct > 0 ? "bullish" : "bearish";
  const opposite = priceMove.changePct > 0 ? "bearish" : "bullish";

  switch (gap.classification) {
    case "fundamental":
      return `This ${direction} thesis breaks if: (1) the fundamental catalyst is walked back or clarified negatively, (2) follow-through fails and price reverses beyond today's open, or (3) sector/macro headwinds overwhelm the stock-specific tailwind.`;

    case "macro":
      return `The current direction reverses if: (1) macro factors driving the sector reverse course, (2) stock-specific news diverges from sector trend, or (3) correlation breaks down suggesting idiosyncratic factors.`;

    case "positioning":
      return `Watch for invalidation if: (1) volume remains elevated with continued selling/buying, suggesting more than rebalancing, (2) fundamental news emerges to justify the move, or (3) institutional ownership changes materially in upcoming filings.`;

    case "narrative":
      return `The narrative-driven move invalidates if: (1) fundamentals confirm the narrative (making it real), (2) counter-narrative emerges with more credibility, or (3) price fails to hold gains/losses beyond 2 sessions.`;

    case "noise":
      return `This "noise" classification is wrong if: (1) the move extends beyond 2x today's range, (2) a hidden catalyst emerges, or (3) technical patterns suggest a trend change rather than random walk.`;

    default:
      return `Monitor for any fundamental, technical, or sentiment changes that would change the thesis.`;
  }
}

/**
 * Build key metrics summary
 */
function buildKeyMetrics(
  priceMove: PriceMove,
  gap: ExpectationGap,
  baseline: ExpectationBaseline,
  secondOrder: SecondOrderAttribution
): { label: string; value: string; context?: string }[] {
  const metrics: { label: string; value: string; context?: string }[] = [];

  // Price change
  metrics.push({
    label: "Price Change",
    value: `${priceMove.changePct > 0 ? "+" : ""}${priceMove.changePct.toFixed(
      2
    )}%`,
    context: `$${priceMove.previousClose.toFixed(
      2
    )} → $${priceMove.currentPrice.toFixed(2)}`,
  });

  // Expected move
  metrics.push({
    label: "Expected Move",
    value: `±${gap.expectedMove.toFixed(1)}%`,
    context:
      gap.moveGapRatio > 1
        ? `${gap.moveGapRatio.toFixed(1)}x expected`
        : "Within range",
  });

  // Volume
  metrics.push({
    label: "Volume",
    value: `${priceMove.volumeRatio.toFixed(1)}x avg`,
    context:
      priceMove.volumeRatio > 2
        ? "Elevated"
        : priceMove.volumeRatio < 0.7
        ? "Light"
        : "Normal",
  });

  // Sector
  if (secondOrder.sectorMove !== undefined) {
    metrics.push({
      label: `Sector (${secondOrder.sectorEtf})`,
      value: `${
        secondOrder.sectorMove > 0 ? "+" : ""
      }${secondOrder.sectorMove.toFixed(2)}%`,
      context: secondOrder.isIdiosyncratic ? "Stock-specific" : "Correlated",
    });
  }

  // Classification
  metrics.push({
    label: "Move Type",
    value:
      gap.classification.charAt(0).toUpperCase() + gap.classification.slice(1),
    context: `${(gap.classificationConfidence * 100).toFixed(0)}% confidence`,
  });

  // Fair value if available
  if (baseline.modelFairValue && baseline.modelUpside) {
    metrics.push({
      label: "Model Fair Value",
      value: `$${baseline.modelFairValue.toFixed(2)}`,
      context: `${
        baseline.modelUpside > 0 ? "+" : ""
      }${baseline.modelUpside.toFixed(1)}% upside`,
    });
  }

  return metrics;
}

/**
 * Determine confidence level
 */
function determineConfidence(gap: ExpectationGap): "high" | "medium" | "low" {
  if (gap.classificationConfidence >= 0.8) return "high";
  if (gap.classificationConfidence >= 0.6) return "medium";
  return "low";
}

/**
 * Generate caveats
 */
function generateCaveats(
  gap: ExpectationGap,
  secondOrder: SecondOrderAttribution
): string[] {
  const caveats: string[] = [];

  if (gap.classificationConfidence < 0.7) {
    caveats.push(
      "Classification confidence is moderate — multiple interpretations possible"
    );
  }

  if (gap.sentimentMoveAlignment === "divergent") {
    caveats.push("Price and sentiment divergence may indicate a reversal");
  }

  if (!secondOrder.isIdiosyncratic && gap.classification === "fundamental") {
    caveats.push("Move may be partially attributed to sector/macro factors");
  }

  if (gap.classification === "noise") {
    caveats.push("Low-signal move — avoid over-interpreting");
  }

  // Always add data caveat
  caveats.push(
    "Analysis based on available public data; insider information may differ"
  );

  return caveats;
}

/**
 * Generate complete narrative output
 */
export function generateNarrative(
  priceMove: PriceMove,
  baseline: ExpectationBaseline,
  gap: ExpectationGap,
  secondOrder: SecondOrderAttribution
): NarrativeOutput {
  return {
    headline: generateHeadline(priceMove, gap, secondOrder),
    whatHappened: generateWhatHappened(priceMove, gap, baseline),
    why: generateWhy(gap, secondOrder),
    whatMattersNext: generateWhatMattersNext(
      priceMove,
      gap,
      baseline,
      secondOrder
    ),
    invalidationThesis: generateInvalidation(priceMove, gap, baseline),
    keyMetrics: buildKeyMetrics(priceMove, gap, baseline, secondOrder),
    confidence: determineConfidence(gap),
    caveats: generateCaveats(gap, secondOrder),
    generatedAt: new Date().toISOString(),
  };
}
