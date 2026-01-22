import { NextResponse } from "next/server";
import { analyzeWatchlist, scanForMoves } from "@shared/lib/engine";

/**
 * Scan symbols for significant moves
 * GET /api/scan?symbols=AAPL,GOOGL,MSFT&analyze=true
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  const shouldAnalyze = searchParams.get("analyze") === "true";
  const threshold = parseFloat(searchParams.get("threshold") || "2.0");

  if (!symbolsParam) {
    return NextResponse.json(
      { error: "symbols parameter is required (comma-separated)" },
      { status: 400 }
    );
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{1,5}$/.test(s))
    .slice(0, 50); // Limit to 50 symbols

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "No valid symbols provided" },
      { status: 400 }
    );
  }

  try {
    const config = {
      priceMovePctThreshold: threshold,
      volumeRatioThreshold: 2.0,
      correlationSpikeThreshold: 0.3,
    };

    if (shouldAnalyze) {
      // Full analysis for significant movers
      const analyses = await analyzeWatchlist(symbols, config);
      return NextResponse.json({
        scanned: symbols.length,
        movers: analyses.length,
        analyses,
      });
    } else {
      // Quick scan only (no full analysis)
      const movers = await scanForMoves(symbols, config);
      return NextResponse.json({
        scanned: symbols.length,
        movers: movers.length,
        results: movers.map((m) => ({
          symbol: m.symbol,
          changePct: m.priceMove.changePct,
          volumeRatio: m.priceMove.volumeRatio,
          trigger: m.trigger,
          reasons: m.reasons,
        })),
      });
    }
  } catch (error) {
    console.error("[API/Scan] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST version with body for larger symbol lists
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbols, analyze = false, threshold = 2.0 } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: "symbols array is required in request body" },
        { status: 400 }
      );
    }

    const validSymbols = symbols
      .map((s: string) => s.trim().toUpperCase())
      .filter((s: string) => /^[A-Z]{1,5}$/.test(s))
      .slice(0, 100); // Limit to 100 symbols for POST

    if (validSymbols.length === 0) {
      return NextResponse.json(
        { error: "No valid symbols provided" },
        { status: 400 }
      );
    }

    const config = {
      priceMovePctThreshold: threshold,
      volumeRatioThreshold: 2.0,
      correlationSpikeThreshold: 0.3,
    };

    if (analyze) {
      const analyses = await analyzeWatchlist(validSymbols, config);
      return NextResponse.json({
        scanned: validSymbols.length,
        movers: analyses.length,
        analyses,
      });
    } else {
      const movers = await scanForMoves(validSymbols, config);
      return NextResponse.json({
        scanned: validSymbols.length,
        movers: movers.length,
        results: movers.map((m) => ({
          symbol: m.symbol,
          changePct: m.priceMove.changePct,
          volumeRatio: m.priceMove.volumeRatio,
          trigger: m.trigger,
          reasons: m.reasons,
        })),
      });
    }
  } catch (error) {
    console.error("[API/Scan] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
