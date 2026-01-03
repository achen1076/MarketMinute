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
      select: { theme: true },
    });

    return NextResponse.json({
      theme: user?.theme || "system",
    });
  } catch (error) {
    console.error("[Theme] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme preference" },
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
    const { theme } = await req.json();

    if (!["light", "dark", "system"].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme preference" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { theme },
    });

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error("[Theme] Error updating:", error);
    return NextResponse.json(
      { error: "Failed to update theme preference" },
      { status: 500 }
    );
  }
}
