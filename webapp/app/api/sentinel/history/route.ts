import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const reports = await prisma.sentinelReport.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        summary: true,
        keyDrivers: true,
        macroContext: true,
        scenarioQuestions: true,
        indexMove: true,
        sectorRotation: true,
        macroSurprise: true,
        volSpike: true,
        vix: true,
        vixChangePct: true,
        realizedVol: true,
      },
    });

    const total = await prisma.sentinelReport.count();

    return NextResponse.json({
      ok: true,
      reports,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[Sentinel] Error fetching report history:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch report history" },
      { status: 500 }
    );
  }
}
