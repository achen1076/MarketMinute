import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol, title, message, type, severity } = await req.json();

    if (!symbol || !title || !message) {
      return NextResponse.json(
        { error: "Symbol, title, and message are required" },
        { status: 400 }
      );
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const alert = await prisma.tickerAlert.create({
      data: {
        symbol: symbol.toUpperCase(),
        type: type || "custom",
        title,
        message,
        severity: severity || "medium",
        expiresAt,
        metadata: {
          createdBy: session.user.email,
          manual: true,
        },
      },
    });

    console.log(`[Admin] Created ticker alert for ${symbol}: ${title}`);

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        symbol: alert.symbol,
        title: alert.title,
      },
    });
  } catch (error) {
    console.error("[Admin] Error creating ticker alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}
