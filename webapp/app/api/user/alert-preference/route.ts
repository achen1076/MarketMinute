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
      select: { alertPreference: true },
    });

    return NextResponse.json({
      alertPreference: user?.alertPreference || "on",
    });
  } catch (error) {
    console.error("[AlertPreference] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert preference" },
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
    const { alertPreference } = await req.json();

    if (!["on", "off"].includes(alertPreference)) {
      return NextResponse.json(
        { error: "Invalid alert preference" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { alertPreference },
    });

    return NextResponse.json({ success: true, alertPreference });
  } catch (error) {
    console.error("[AlertPreference] Error updating:", error);
    return NextResponse.json(
      { error: "Failed to update alert preference" },
      { status: 500 }
    );
  }
}
