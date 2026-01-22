import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSnapshotsForSymbols } from "@shared/lib/marketData";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      watchlists: {
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  const watchlists = user?.watchlists ?? [];
  const activeWatchlist = user?.activeWatchlistId
    ? watchlists.find((w) => w.id === user.activeWatchlistId) ?? null
    : watchlists[0] ?? null;

  let snapshots: any[] = [];
  if (activeWatchlist && activeWatchlist.items.length > 0) {
    const symbols = activeWatchlist.items.map((item) => item.symbol);
    const rawSnapshots = await getSnapshotsForSymbols(symbols);

    snapshots = rawSnapshots.map((snapshot) => {
      const item = activeWatchlist.items.find(
        (i) => i.symbol === snapshot.symbol
      );
      return {
        ...snapshot,
        isFavorite: item?.isFavorite ?? false,
        itemId: item?.id ?? null,
      };
    });
  }

  return (
    <HomeClient
      watchlists={watchlists}
      activeWatchlist={activeWatchlist}
      initialSnapshots={snapshots}
    />
  );
}
