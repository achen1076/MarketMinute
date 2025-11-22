import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        sentinelFocus: true,
        sentinelDepth: true,
      },
    });

    return NextResponse.json({
      ok: true,
      preferences: {
        focus: user?.sentinelFocus || "balanced",
        depth: user?.sentinelDepth || "standard",
      },
    });
  } catch (err) {
    console.error("[Sentinel] Error fetching preferences:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { focus, depth } = await request.json();

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        sentinelFocus: focus,
        sentinelDepth: depth,
      },
    });

    return NextResponse.json({
      ok: true,
      preferences: { focus, depth },
    });
  } catch (err) {
    console.error("[Sentinel] Error updating preferences:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
