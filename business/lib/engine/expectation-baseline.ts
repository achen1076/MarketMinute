// ============================================
// EXPECTATION BASELINE MODULE
// Fetches and stores market expectations
// ============================================

import type { ExpectationBaseline } from "../types";

/**
 * Fetch analyst estimates and ratings from FMP
 */
async function fetchAnalystData(
  symbol: string
): Promise<Partial<ExpectationBaseline>> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return {};

  try {
    // Fetch analyst estimates
    const estimatesRes = await fetch(
      `https://financialmodelingprep.com/stable/analyst-estimates?symbol=${symbol}&limit=1&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    // Fetch analyst ratings
    const ratingsRes = await fetch(
      `https://financialmodelingprep.com/stable/grades?symbol=${symbol}&limit=10&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    // Fetch price target
    const targetRes = await fetch(
      `https://financialmodelingprep.com/stable/price-target?symbol=${symbol}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    const baseline: Partial<ExpectationBaseline> = {};

    if (estimatesRes.ok) {
      const estimates = await estimatesRes.json();
      if (estimates && estimates.length > 0) {
        const est = estimates[0];
        baseline.consensusEps = est.estimatedEpsAvg;
        baseline.consensusRevenue = est.estimatedRevenueAvg;
        baseline.epsGrowthEstimate = est.estimatedEpsGrowth;
        baseline.revenueGrowthEstimate = est.estimatedRevenueGrowth;
      }
    }

    if (targetRes.ok) {
      const targets = await targetRes.json();
      if (targets && targets.length > 0) {
        // Aggregate analyst targets
        const prices = targets
          .map((t: { priceTarget: number }) => t.priceTarget)
          .filter(Boolean);
        if (prices.length > 0) {
          baseline.analystTargetMean =
            prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
          baseline.analystTargetHigh = Math.max(...prices);
          baseline.analystTargetLow = Math.min(...prices);
        }
      }
    }

    if (ratingsRes.ok) {
      const ratings = await ratingsRes.json();
      if (ratings && ratings.length > 0) {
        // Convert ratings to score (1-5)
        const ratingMap: Record<string, number> = {
          "Strong Buy": 5,
          Buy: 4,
          Hold: 3,
          Underperform: 2,
          Sell: 2,
          "Strong Sell": 1,
        };
        const scores = ratings
          .map((r: { newGrade: string }) => ratingMap[r.newGrade])
          .filter(Boolean);
        if (scores.length > 0) {
          baseline.analystRatingScore =
            scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        }
      }
    }

    return baseline;
  } catch (error) {
    console.error(`[ExpectationBaseline] Error fetching analyst data:`, error);
    return {};
  }
}

/**
 * Calculate historical earnings reaction patterns
 */
async function fetchHistoricalReactions(
  symbol: string
): Promise<Partial<ExpectationBaseline>> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return {};

  try {
    // Fetch earnings surprises
    const surprisesRes = await fetch(
      `https://financialmodelingprep.com/stable/earnings-surprises?symbol=${symbol}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!surprisesRes.ok) return {};

    const surprises = await surprisesRes.json();
    if (!surprises || surprises.length < 4) return {};

    // Calculate average reactions (we'd need price data too - simplified for now)
    // In production, you'd correlate surprise dates with price moves
    const baseline: Partial<ExpectationBaseline> = {};

    // Estimate average earnings move based on typical patterns
    // This is a simplified heuristic - real implementation would analyze historical price data
    const avgSurprise =
      surprises
        .slice(0, 8)
        .reduce(
          (
            acc: number,
            s: { actualEarningResult: number; estimatedEarning: number }
          ) => acc + Math.abs(s.actualEarningResult - s.estimatedEarning),
          0
        ) / Math.min(8, surprises.length);

    // Rough estimate: 1% surprise = 2% move (simplified heuristic)
    baseline.avgEarningsMove = Math.min(avgSurprise * 2, 10);

    return baseline;
  } catch (error) {
    console.error(`[ExpectationBaseline] Error fetching reactions:`, error);
    return {};
  }
}

/**
 * Fetch options implied move (if available)
 * Note: This would require options data API - using estimate for now
 */
async function fetchImpliedMove(
  symbol: string,
  currentPrice: number
): Promise<Partial<ExpectationBaseline>> {
  // In production, you'd fetch actual options data
  // For now, we estimate based on historical volatility
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return {};

  try {
    // Fetch key metrics which includes beta
    const metricsRes = await fetch(
      `https://financialmodelingprep.com/stable/key-metrics?symbol=${symbol}&limit=1&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!metricsRes.ok) return {};

    const metrics = await metricsRes.json();
    if (!metrics || metrics.length === 0) return {};

    // Use profile for beta
    const profileRes = await fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!profileRes.ok) return {};

    const profile = await profileRes.json();
    const beta = profile[0]?.beta || 1;

    // Rough IV estimate: base 25% + beta adjustment
    const estimatedIV = 25 + (beta - 1) * 10;

    // Implied daily move = IV / sqrt(252)
    const impliedDailyMove = estimatedIV / Math.sqrt(252);

    return {
      impliedMove: impliedDailyMove,
      iv30: estimatedIV,
      ivPercentile: 50, // Would need historical IV data
    };
  } catch (error) {
    console.error(`[ExpectationBaseline] Error fetching implied move:`, error);
    return {};
  }
}

/**
 * Calculate rough fair value estimate
 */
async function fetchFairValueEstimate(
  symbol: string,
  currentPrice: number
): Promise<Partial<ExpectationBaseline>> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return {};

  try {
    // Fetch DCF value from FMP
    const dcfRes = await fetch(
      `https://financialmodelingprep.com/stable/discounted-cash-flow?symbol=${symbol}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!dcfRes.ok) return {};

    const dcf = await dcfRes.json();
    if (!dcf || dcf.length === 0) return {};

    const fairValue = dcf[0]?.dcf;
    if (!fairValue || fairValue <= 0) return {};

    return {
      modelFairValue: fairValue,
      modelUpside: ((fairValue - currentPrice) / currentPrice) * 100,
    };
  } catch (error) {
    console.error(`[ExpectationBaseline] Error fetching fair value:`, error);
    return {};
  }
}

/**
 * Build complete expectation baseline for a symbol
 */
export async function buildExpectationBaseline(
  symbol: string,
  currentPrice: number
): Promise<ExpectationBaseline> {
  // Fetch all data in parallel
  const [analystData, historicalReactions, impliedMove, fairValue] =
    await Promise.all([
      fetchAnalystData(symbol),
      fetchHistoricalReactions(symbol),
      fetchImpliedMove(symbol, currentPrice),
      fetchFairValueEstimate(symbol, currentPrice),
    ]);

  const baseline: ExpectationBaseline = {
    symbol,
    ...analystData,
    ...historicalReactions,
    ...impliedMove,
    ...fairValue,
    lastUpdated: new Date().toISOString(),
  };

  return baseline;
}

/**
 * Get expected move based on baseline data
 * Returns the best estimate of expected daily move
 */
export function getExpectedMove(baseline: ExpectationBaseline): number {
  // Priority: implied move > historical earnings move > default
  if (baseline.impliedMove && baseline.impliedMove > 0) {
    return baseline.impliedMove;
  }

  if (baseline.avgEarningsMove && baseline.avgEarningsMove > 0) {
    // Scale down for non-earnings days
    return baseline.avgEarningsMove * 0.3;
  }

  // Default: ~1.5% expected move for average stock
  return 1.5;
}
