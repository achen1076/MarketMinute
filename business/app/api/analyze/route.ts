import { NextResponse } from "next/server";
import { analyzeSymbol } from "@shared/lib/engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  const upperSymbol = symbol.toUpperCase().trim();

  // Validate symbol format
  if (!/^[A-Z]{1,5}$/.test(upperSymbol)) {
    return NextResponse.json(
      { error: "Invalid symbol format" },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeSymbol(upperSymbol, "manual");

    if (!analysis) {
      return NextResponse.json(
        { error: "Failed to analyze symbol. It may not be a valid ticker." },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[API/Analyze] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required in request body" },
        { status: 400 }
      );
    }

    const upperSymbol = symbol.toUpperCase().trim();

    const analysis = await analyzeSymbol(upperSymbol, "manual");

    if (!analysis) {
      return NextResponse.json(
        { error: "Failed to analyze symbol" },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[API/Analyze] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
