import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processSentimentAlertsForSymbols } from "@shared/lib/sentimentAlerts";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "achen1076@gmail.com";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();

    // Option 1: Process specific symbols with sentiment data
    if (body.symbols && Array.isArray(body.symbols)) {
      const result = await processSentimentAlertsForSymbols(body.symbols);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Option 2: Process all unique symbols from all watchlists
    const uniqueSymbols = await prisma.watchlistItem.findMany({
      select: { symbol: true },
      distinct: ["symbol"],
    });

    // Note: In production, you'd fetch current sentiment from your news/sentiment service
    // This is a placeholder that shows the structure
    return NextResponse.json({
      success: true,
      message: "Sentiment alert processing endpoint ready",
      uniqueSymbolCount: uniqueSymbols.length,
      symbols: uniqueSymbols.map((s: { symbol: string }) => s.symbol),
    });
  } catch (error) {
    console.error("[SentimentAlerts] Error:", error);
    return NextResponse.json(
      { error: "Failed to process sentiment alerts" },
      { status: 500 }
    );
  }
}
