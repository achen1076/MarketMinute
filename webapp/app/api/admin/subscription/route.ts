import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ADMIN_EMAILS = ["achen1076@gmail.com"];

// Get users list
export async function GET() {
  const session = await auth();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ users });
}

// Update user subscription
export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { userId, subscriptionTier } = body as {
    userId: string;
    subscriptionTier: "free" | "basic";
  };

  if (!userId || !subscriptionTier) {
    return new NextResponse("userId and subscriptionTier required", {
      status: 400,
    });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier,
      subscriptionStatus: subscriptionTier === "basic" ? "active" : "inactive",
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  return NextResponse.json({ user });
}
