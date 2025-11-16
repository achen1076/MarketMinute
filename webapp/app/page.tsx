// app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      watchlists: {
        include: {
          items: true,
        },
        orderBy: [
          { isFavorite: "desc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  // Auto-set first watchlist as active if no active watchlist is set
  let activeWatchlistId = user?.activeWatchlistId;
  if (!activeWatchlistId && user?.watchlists.length) {
    activeWatchlistId = user.watchlists[0].id;
    // Update user's active watchlist
    await prisma.user.update({
      where: { email: session.user.email },
      data: { activeWatchlistId: user.watchlists[0].id },
    });
  }

  const activeWatchlist = user?.watchlists.find(
    (w: { id: string }) => w.id === activeWatchlistId
  );

  return (
    <DashboardClient
      watchlists={user?.watchlists ?? []}
      activeWatchlist={activeWatchlist ?? null}
    />
  );
}
