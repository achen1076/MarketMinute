import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: {
      userId: string;
      ticker?: { contains: string; mode: "insensitive" };
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      userId: session.user.id,
    };

    if (ticker) {
      where.ticker = { contains: ticker, mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const cards = await prisma.eGECard.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { analysis } = body;

    if (!analysis) {
      return NextResponse.json(
        { error: "Missing analysis data" },
        { status: 400 }
      );
    }

    const card = await prisma.eGECard.create({
      data: {
        userId: session.user.id,
        ticker: analysis.symbol,
        analysisId: analysis.analysisId,
        changePct: analysis.priceMove.changePct,
        currentPrice: analysis.priceMove.currentPrice,
        previousClose: analysis.priceMove.previousClose,
        volumeRatio: analysis.priceMove.volumeRatio,
        classification: analysis.gap.classification,
        confidence: analysis.narrative.confidence,
        narrative: analysis.narrative,
        secondOrder: analysis.secondOrder,
        gap: analysis.gap,
        baseline: analysis.baseline,
      },
    });

    return NextResponse.json({ card, success: true });
  } catch (error) {
    console.error("Error saving card:", error);
    return NextResponse.json({ error: "Failed to save card" }, { status: 500 });
  }
}
