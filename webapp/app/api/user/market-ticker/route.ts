import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { showMarketTicker } = await req.json();

    if (typeof showMarketTicker !== "boolean") {
      return NextResponse.json(
        { error: "showMarketTicker must be a boolean" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { showMarketTicker },
      select: { showMarketTicker: true },
    });

    return NextResponse.json({ showMarketTicker: user.showMarketTicker });
  } catch (error) {
    console.error("[MARKET_TICKER_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update market ticker preference" },
      { status: 500 }
    );
  }
}
