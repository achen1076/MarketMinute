import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { tickerColoring: true },
    });

    return NextResponse.json({
      tickerColoring: user?.tickerColoring || "on",
    });
  } catch (error) {
    console.error("[TickerColoring] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticker coloring preference" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { tickerColoring } = await req.json();

    if (!["on", "off"].includes(tickerColoring)) {
      return NextResponse.json(
        { error: "Invalid ticker coloring preference" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { tickerColoring: tickerColoring },
    });

    return NextResponse.json({ success: true, tickerColoring });
  } catch (error) {
    console.error("[TickerColoring] Error updating:", error);
    return NextResponse.json(
      { error: "Failed to update ticker coloring preference" },
      { status: 500 }
    );
  }
}
