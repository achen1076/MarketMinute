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
      select: {
        theme: true,
        alertPreference: true,
        tickerColoring: true,
      },
    });

    return NextResponse.json({
      theme: user?.theme || "system",
      alertPreference: user?.alertPreference || "on",
      tickerColoring: user?.tickerColoring || "on",
    });
  } catch (error) {
    console.error("[Preferences] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}
