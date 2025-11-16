import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const watchlistId = searchParams.get("watchlistId");

  if (!watchlistId) {
    return new NextResponse("Watchlist ID required", { status: 400 });
  }

  const macros = await prisma.macro.findMany({
    where: { watchlistId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(macros);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { watchlistId, name, type, params } = body as {
    watchlistId: string;
    name: string;
    type: string;
    params?: Record<string, unknown>;
  };

  // Verify user owns the watchlist
  const watchlist = await prisma.watchlist.findFirst({
    where: {
      id: watchlistId,
      user: { email: session.user.email },
    },
  });

  if (!watchlist) {
    return new NextResponse("Watchlist not found", { status: 404 });
  }

  const macro = await prisma.macro.create({
    data: {
      watchlistId,
      name,
      type,
      params: params ? JSON.stringify(params) : null,
    },
  });

  return NextResponse.json(macro, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const macroId = searchParams.get("id");

  if (!macroId) {
    return new NextResponse("Macro ID required", { status: 400 });
  }

  // Verify user owns the macro's watchlist
  const macro = await prisma.macro.findFirst({
    where: {
      id: macroId,
      watchlist: {
        user: { email: session.user.email },
      },
    },
  });

  if (!macro) {
    return new NextResponse("Macro not found", { status: 404 });
  }

  await prisma.macro.delete({
    where: { id: macroId },
  });

  return new NextResponse(null, { status: 204 });
}
