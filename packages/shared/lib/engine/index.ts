// ============================================
// EXPECTATION GAP ENGINE
// Main orchestrator that ties all modules together
// ============================================

import type {
  ExpectationGapAnalysis,
  MoveTrigger,
  MoveDetectionConfig,
} from "../types";
import { fetchPriceData, detectTrigger, scanForMoves } from "./move-detection";
import { buildExpectationBaseline } from "./expectation-baseline";
import { analyzeExpectationGap } from "./gap-classifier";
import { buildSecondOrderAttribution } from "./second-order";
import { generateNarrative } from "./narrative";

/**
 * Generate a unique analysis ID
 */
function generateAnalysisId(): string {
  return `ega_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Run full expectation gap analysis for a symbol
 */
export async function analyzeSymbol(
  symbol: string,
  trigger: MoveTrigger = "manual"
): Promise<ExpectationGapAnalysis | null> {
  console.log(`[ExpectationGapEngine] Analyzing ${symbol}...`);
  const startTime = Date.now();

  try {
    // 1. Fetch current price data
    const priceMove = await fetchPriceData(symbol);
    if (!priceMove) {
      console.error(
        `[ExpectationGapEngine] Failed to fetch price data for ${symbol}`
      );
      return null;
    }

    // Validate price data has required fields
    if (
      priceMove.currentPrice === undefined ||
      priceMove.changePct === undefined
    ) {
      console.error(
        `[ExpectationGapEngine] Invalid price data for ${symbol}:`,
        priceMove
      );
      return null;
    }

    console.log(
      `[ExpectationGapEngine] ${symbol}: ${(priceMove.changePct ?? 0).toFixed(
        2
      )}% move`
    );

    // 2. Build expectation baseline
    const baseline = await buildExpectationBaseline(
      symbol,
      priceMove.currentPrice
    );
    console.log(`[ExpectationGapEngine] Baseline built for ${symbol}`);

    // 3. Build second-order attribution (sector, macro, correlations)
    const secondOrder = await buildSecondOrderAttribution(priceMove);
    console.log(
      `[ExpectationGapEngine] Second-order: sector=${secondOrder.sectorEtf}, idiosyncratic=${secondOrder.isIdiosyncratic}`
    );

    // 4. Analyze expectation gap
    const gap = await analyzeExpectationGap(
      priceMove,
      baseline,
      secondOrder.sectorMove || 0
    );
    console.log(
      `[ExpectationGapEngine] Classification: ${gap.classification} (${(
        gap.classificationConfidence * 100
      ).toFixed(0)}%)`
    );

    // 5. Generate narrative
    const narrative = generateNarrative(priceMove, baseline, gap, secondOrder);

    const analysis: ExpectationGapAnalysis = {
      symbol,
      trigger,
      priceMove,
      baseline,
      gap,
      secondOrder,
      narrative,
      analysisId: generateAnalysisId(),
      createdAt: new Date().toISOString(),
    };

    console.log(
      `[ExpectationGapEngine] Analysis complete for ${symbol} in ${
        Date.now() - startTime
      }ms`
    );

    return analysis;
  } catch (error) {
    console.error(`[ExpectationGapEngine] Error analyzing ${symbol}:`, error);
    return null;
  }
}

/**
 * Scan watchlist and return significant movers with analysis
 */
export async function analyzeWatchlist(
  symbols: string[],
  config?: MoveDetectionConfig
): Promise<ExpectationGapAnalysis[]> {
  console.log(
    `[ExpectationGapEngine] Scanning ${symbols.length} symbols for significant moves...`
  );

  // Find significant movers
  const movers = await scanForMoves(symbols, config);
  console.log(
    `[ExpectationGapEngine] Found ${movers.length} significant movers`
  );

  // Analyze each mover
  const analyses: ExpectationGapAnalysis[] = [];

  for (const mover of movers.slice(0, 10)) {
    // Limit to top 10
    const analysis = await analyzeSymbol(mover.symbol, mover.trigger);
    if (analysis) {
      analyses.push(analysis);
    }
  }

  return analyses;
}

/**
 * Quick check if a symbol warrants full analysis
 */
export async function shouldAnalyzeSymbol(
  symbol: string,
  config?: MoveDetectionConfig
): Promise<{
  shouldAnalyze: boolean;
  trigger: MoveTrigger;
  reasons: string[];
  quickStats?: {
    changePct: number;
    volumeRatio: number;
  };
}> {
  const priceMove = await fetchPriceData(symbol);

  if (!priceMove) {
    return {
      shouldAnalyze: false,
      trigger: "manual",
      reasons: ["Failed to fetch price data"],
    };
  }

  const detection = detectTrigger(priceMove, config);

  return {
    shouldAnalyze: detection.triggered,
    trigger: detection.trigger,
    reasons: detection.reasons,
    quickStats: {
      changePct: priceMove.changePct,
      volumeRatio: priceMove.volumeRatio,
    },
  };
}

// Re-export types and utilities
export * from "../types";
export { fetchPriceData, scanForMoves } from "./move-detection";
export {
  buildExpectationBaseline,
  getExpectedMove,
} from "./expectation-baseline";
