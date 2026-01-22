// ============================================
// SECOND-ORDER ATTRIBUTION MODULE
// Analyzes sector, correlation, and macro context
// ============================================

import type { SecondOrderAttribution, PriceMove } from "../types";
import { SECTOR_ETFS, MACRO_FACTORS } from "../types";

interface QuoteData {
  symbol: string;
  price: number;
  changesPercentage: number;
  changePercentage?: number;
  change: number;
}

/**
 * Fetch company profile to get sector
 */
async function fetchCompanySector(symbol: string): Promise<string | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data[0]?.sector || null;
  } catch {
    return null;
  }
}

/**
 * Fetch quote data for multiple symbols
 */
async function fetchQuotes(symbols: string[]): Promise<Map<string, QuoteData>> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return new Map();

  try {
    const symbolList = symbols.join(",");
    const res = await fetch(
      `https://financialmodelingprep.com/stable/batch-quote?symbols=${symbolList}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) return new Map();

    const rawData = await res.json();
    const data: QuoteData[] = Array.isArray(rawData) ? rawData : [rawData];
    const map = new Map<string, QuoteData>();

    for (const quote of data) {
      if (!quote || !quote.symbol) continue;
      // Normalize field names
      const normalizedQuote: QuoteData = {
        symbol: quote.symbol,
        price: quote.price ?? 0,
        changesPercentage:
          quote.changePercentage ?? quote.changesPercentage ?? 0,
        change: quote.change ?? 0,
      };
      map.set(quote.symbol, normalizedQuote);
    }

    return map;
  } catch {
    return new Map();
  }
}

/**
 * Fetch sector ETF performance
 */
async function fetchSectorMove(
  sector: string
): Promise<{ etf: string; move: number } | null> {
  const etf = SECTOR_ETFS[sector];
  if (!etf) return null;

  const quotes = await fetchQuotes([etf]);
  const quote = quotes.get(etf);

  if (!quote) return null;

  return {
    etf,
    move: quote.changesPercentage,
  };
}

/**
 * Fetch macro factor moves
 */
async function fetchMacroMoves(): Promise<
  {
    factor: string;
    move: number;
    impact: "positive" | "negative" | "neutral";
  }[]
> {
  const symbols = MACRO_FACTORS.map((f) => f.symbol);
  const quotes = await fetchQuotes(symbols);

  return MACRO_FACTORS.map((factor) => {
    const quote = quotes.get(factor.symbol);
    const move = quote?.changesPercentage || 0;

    // Determine impact (simplified)
    let impact: "positive" | "negative" | "neutral" = "neutral";
    if (Math.abs(move) > 0.5) {
      // For rates: up = negative for growth, positive for financials
      // For USD: up = negative for multinationals
      // For VIX: up = negative for equities
      if (factor.type === "rates" || factor.type === "volatility") {
        impact = move > 0 ? "negative" : "positive";
      } else if (factor.type === "currency") {
        impact = move > 0 ? "negative" : "positive";
      } else {
        impact = move > 0 ? "positive" : "negative";
      }
    }

    return {
      factor: factor.name,
      move,
      impact,
    };
  });
}

/**
 * Find correlated movers in the same sector
 */
async function fetchCorrelatedMovers(
  symbol: string,
  sector: string
): Promise<{ symbol: string; move: number; correlation: number }[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return [];

  try {
    // Fetch sector constituents (simplified - using stock screener)
    const res = await fetch(
      `https://financialmodelingprep.com/stable/stock-screener?sector=${encodeURIComponent(
        sector
      )}&marketCapMoreThan=10000000000&limit=20&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) return [];

    const stocks: { symbol: string }[] = await res.json();
    const peerSymbols = stocks
      .map((s) => s.symbol)
      .filter((s) => s !== symbol)
      .slice(0, 10);

    if (peerSymbols.length === 0) return [];

    // Fetch quotes for peers
    const quotes = await fetchQuotes(peerSymbols);

    // Sort by absolute move
    const movers = Array.from(quotes.values())
      .map((q) => ({
        symbol: q.symbol,
        move: q.changesPercentage,
        correlation: 0.8, // Placeholder - would need historical data for real correlation
      }))
      .sort((a, b) => Math.abs(b.move) - Math.abs(a.move))
      .slice(0, 3);

    return movers;
  } catch {
    return [];
  }
}

/**
 * Calculate if move is idiosyncratic
 */
function isIdiosyncraticMove(
  stockMove: number,
  sectorMove: number,
  correlatedMoves: { move: number }[]
): boolean {
  // If stock move direction differs from sector, likely idiosyncratic
  if (Math.sign(stockMove) !== Math.sign(sectorMove)) {
    return true;
  }

  // If stock move is 2x+ sector move, likely idiosyncratic
  if (Math.abs(stockMove) > Math.abs(sectorMove) * 2) {
    return true;
  }

  // If most correlated stocks moved opposite, likely idiosyncratic
  const oppositeMovers = correlatedMoves.filter(
    (m) => Math.sign(m.move) !== Math.sign(stockMove)
  );
  if (oppositeMovers.length > correlatedMoves.length / 2) {
    return true;
  }

  return false;
}

/**
 * Determine primary driver
 */
function determinePrimaryDriver(
  isIdiosyncratic: boolean,
  sectorMove: number,
  macroFactors: {
    factor: string;
    move: number;
    impact: "positive" | "negative" | "neutral";
  }[]
): string | undefined {
  if (isIdiosyncratic) {
    return "stock-specific catalyst";
  }

  // Find most impactful macro factor
  const significantMacro = macroFactors
    .filter((f) => Math.abs(f.move) > 0.5 && f.impact !== "neutral")
    .sort((a, b) => Math.abs(b.move) - Math.abs(a.move))[0];

  if (
    significantMacro &&
    Math.abs(significantMacro.move) > Math.abs(sectorMove)
  ) {
    return significantMacro.factor.toLowerCase();
  }

  if (Math.abs(sectorMove) > 0.5) {
    return "sector rotation";
  }

  return undefined;
}

/**
 * Build complete second-order attribution
 */
export async function buildSecondOrderAttribution(
  priceMove: PriceMove
): Promise<SecondOrderAttribution> {
  // Fetch sector
  const sector = await fetchCompanySector(priceMove.symbol);

  // Fetch sector move
  const sectorData = sector ? await fetchSectorMove(sector) : null;

  // Fetch macro moves
  const macroFactors = await fetchMacroMoves();

  // Fetch correlated movers
  const correlatedTickers = sector
    ? await fetchCorrelatedMovers(priceMove.symbol, sector)
    : [];

  // Calculate sector correlation
  const sectorCorrelation = sectorData
    ? Math.min(
        1,
        (Math.abs(priceMove.changePct) / (Math.abs(sectorData.move) + 0.01)) *
          (Math.sign(priceMove.changePct) === Math.sign(sectorData.move)
            ? 1
            : -1)
      )
    : 0;

  // Determine if idiosyncratic
  const isIdiosyncratic = isIdiosyncraticMove(
    priceMove.changePct,
    sectorData?.move || 0,
    correlatedTickers
  );

  // Determine primary driver
  const primaryDriver = determinePrimaryDriver(
    isIdiosyncratic,
    sectorData?.move || 0,
    macroFactors
  );

  return {
    sectorEtf: sectorData?.etf,
    sectorMove: sectorData?.move,
    sectorCorrelation: Math.abs(sectorCorrelation),
    correlatedTickers,
    macroFactors,
    isIdiosyncratic,
    primaryDriver,
  };
}
