import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WatchlistsClient } from "./WatchlistsClient";

export default async function WatchlistPage() {
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

  return (
    <WatchlistsClient
      initialWatchlists={watchlists}
      userName={session.user.name || session.user.email}
    />
  );
}
