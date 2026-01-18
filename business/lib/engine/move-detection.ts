// ============================================
// MOVE DETECTION MODULE
// Detects significant price moves and triggers
// ============================================

import type { PriceMove, MoveTrigger, MoveDetectionConfig } from "../types";

const DEFAULT_CONFIG: MoveDetectionConfig = {
  priceMovePctThreshold: 2.0, // ±2% triggers analysis
  volumeRatioThreshold: 2.0, // 2x avg volume
  correlationSpikeThreshold: 0.3, // Unusual correlation delta
};

/**
 * Fetch current price data for a symbol
 */
export async function fetchPriceData(
  symbol: string
): Promise<PriceMove | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[MoveDetection] FMP_API_KEY not configured");
    return null;
  }

  try {
    // Fetch quote data
    const quoteRes = await fetch(
      `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!quoteRes.ok) {
      console.error(`[MoveDetection] Failed to fetch quote for ${symbol}`);
      return null;
    }

    const quoteData = await quoteRes.json();

    // Debug: log the response structure
    console.log(
      `[MoveDetection] Raw response for ${symbol}:`,
      JSON.stringify(quoteData).slice(0, 500)
    );

    // Handle different response formats (array vs single object)
    let quote;
    if (Array.isArray(quoteData)) {
      if (quoteData.length === 0) {
        console.error(`[MoveDetection] Empty array response for ${symbol}`);
        return null;
      }
      quote = quoteData[0];
    } else if (quoteData && typeof quoteData === "object") {
      quote = quoteData;
    } else {
      console.error(`[MoveDetection] Invalid response format for ${symbol}`);
      return null;
    }

    // Handle different field names between API versions
    const changePct = quote.changePercentage ?? quote.changesPercentage ?? 0;
    const currentPrice = quote.price ?? 0;
    const previousClose = quote.previousClose ?? 0;
    const change = quote.change ?? 0;
    const volume = quote.volume ?? 0;
    const avgVolume = quote.avgVolume ?? quote.averageVolume ?? volume;
    const dayHigh = quote.dayHigh ?? quote.high ?? currentPrice;
    const dayLow = quote.dayLow ?? quote.low ?? currentPrice;

    const priceMove: PriceMove = {
      symbol: quote.symbol || symbol,
      currentPrice,
      previousClose,
      change,
      changePct,
      volume,
      avgVolume,
      volumeRatio: avgVolume > 0 ? volume / avgVolume : 1,
      timestamp: new Date().toISOString(),
      intradayHigh: dayHigh,
      intradayLow: dayLow,
      intradayRange:
        previousClose > 0 ? ((dayHigh - dayLow) / previousClose) * 100 : 0,
    };

    return priceMove;
  } catch (error) {
    console.error(`[MoveDetection] Error fetching price data:`, error);
    return null;
  }
}

/**
 * Determine what triggered the move analysis
 */
export function detectTrigger(
  priceMove: PriceMove,
  config: MoveDetectionConfig = DEFAULT_CONFIG
): { triggered: boolean; trigger: MoveTrigger; reasons: string[] } {
  const reasons: string[] = [];
  let triggered = false;
  let primaryTrigger: MoveTrigger = "manual";

  // Check price move threshold
  if (Math.abs(priceMove.changePct) >= config.priceMovePctThreshold) {
    triggered = true;
    primaryTrigger = "price_move";
    reasons.push(
      `Price move of ${priceMove.changePct.toFixed(2)}% exceeds ±${
        config.priceMovePctThreshold
      }% threshold`
    );
  }

  // Check volume spike
  if (priceMove.volumeRatio >= config.volumeRatioThreshold) {
    triggered = true;
    if (primaryTrigger === "manual") {
      primaryTrigger = "volume_spike";
    }
    reasons.push(
      `Volume ${priceMove.volumeRatio.toFixed(1)}x average exceeds ${
        config.volumeRatioThreshold
      }x threshold`
    );
  }

  // Check for wide intraday range (potential volatility event)
  if (priceMove.intradayRange > 4) {
    triggered = true;
    reasons.push(
      `Intraday range of ${priceMove.intradayRange.toFixed(
        1
      )}% indicates high volatility`
    );
  }

  return {
    triggered,
    trigger: primaryTrigger,
    reasons,
  };
}

/**
 * Check if a stock should be analyzed based on current conditions
 */
export async function shouldAnalyze(
  symbol: string,
  config: MoveDetectionConfig = DEFAULT_CONFIG
): Promise<{
  shouldAnalyze: boolean;
  priceMove: PriceMove | null;
  trigger: MoveTrigger;
  reasons: string[];
}> {
  const priceMove = await fetchPriceData(symbol);

  if (!priceMove) {
    return {
      shouldAnalyze: false,
      priceMove: null,
      trigger: "manual",
      reasons: ["Failed to fetch price data"],
    };
  }

  const detection = detectTrigger(priceMove, config);

  return {
    shouldAnalyze: detection.triggered,
    priceMove,
    trigger: detection.trigger,
    reasons: detection.reasons,
  };
}

/**
 * Scan multiple symbols for significant moves
 */
export async function scanForMoves(
  symbols: string[],
  config: MoveDetectionConfig = DEFAULT_CONFIG
): Promise<
  {
    symbol: string;
    priceMove: PriceMove;
    trigger: MoveTrigger;
    reasons: string[];
  }[]
> {
  const results: {
    symbol: string;
    priceMove: PriceMove;
    trigger: MoveTrigger;
    reasons: string[];
  }[] = [];

  // Batch fetch - FMP supports comma-separated symbols
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[MoveDetection] FMP_API_KEY not configured");
    return results;
  }

  try {
    const symbolList = symbols.join(",");
    const quoteRes = await fetch(
      `https://financialmodelingprep.com/stable/batch-quote?symbols=${symbolList}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!quoteRes.ok) {
      console.error("[MoveDetection] Failed to batch fetch quotes");
      return results;
    }

    const quotesData = await quoteRes.json();

    // Handle different response formats
    const quotes = Array.isArray(quotesData) ? quotesData : [quotesData];

    for (const quote of quotes) {
      if (!quote || !quote.symbol) continue;

      // Handle different field names between API versions
      const changePct = quote.changePercentage ?? quote.changesPercentage ?? 0;
      const currentPrice = quote.price ?? 0;
      const previousClose = quote.previousClose ?? 0;
      const change = quote.change ?? 0;
      const volume = quote.volume ?? 0;
      const avgVolume = quote.avgVolume ?? quote.averageVolume ?? volume;
      const dayHigh = quote.dayHigh ?? quote.high ?? currentPrice;
      const dayLow = quote.dayLow ?? quote.low ?? currentPrice;

      const priceMove: PriceMove = {
        symbol: quote.symbol,
        currentPrice,
        previousClose,
        change,
        changePct,
        volume,
        avgVolume,
        volumeRatio: avgVolume > 0 ? volume / avgVolume : 1,
        timestamp: new Date().toISOString(),
        intradayHigh: dayHigh,
        intradayLow: dayLow,
        intradayRange:
          previousClose > 0 ? ((dayHigh - dayLow) / previousClose) * 100 : 0,
      };

      const detection = detectTrigger(priceMove, config);

      if (detection.triggered) {
        results.push({
          symbol: quote.symbol,
          priceMove,
          trigger: detection.trigger,
          reasons: detection.reasons,
        });
      }
    }

    // Sort by absolute move size
    results.sort(
      (a, b) =>
        Math.abs(b.priceMove.changePct) - Math.abs(a.priceMove.changePct)
    );

    return results;
  } catch (error) {
    console.error("[MoveDetection] Batch scan error:", error);
    return results;
  }
}
