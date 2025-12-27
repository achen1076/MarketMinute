import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WatchlistsClient from "./WatchlistsClient";
import { getTierConfig, SubscriptionTier } from "@/lib/subscription-tiers";

export const metadata = {
  title: "MarketMinute - Watchlists",
  description: "Manage your watchlists and track your favorite stocks.",
};

export default async function WatchlistPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      watchlists: {
        include: { items: true },
        orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  const tier = (user?.subscriptionTier || "free") as SubscriptionTier;
  const tierConfig = getTierConfig(tier);
  const maxSymbols = tierConfig.features.maxWatchlistItems;

  return (
    <WatchlistsClient
      initialWatchlists={user?.watchlists ?? []}
      userName={session.user.name ?? session.user.email ?? "You"}
      maxSymbols={maxSymbols === "unlimited" ? undefined : maxSymbols}
    />
  );
}
