import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WatchlistSelector from "@/components/organisms/WatchlistSelector";
import QuantScriptRunner from "@/components/admin/QuantScriptRunner";
import SentinelRunner from "@/components/admin/SentinelRunner";
import LambdaCronRunner from "@/components/admin/LambdaCronRunner";
import NewsProcessor from "@/components/admin/NewsProcessor";
import SentimentAlertsTester from "@/components/admin/SentimentAlertsTester";
import TickerAlertCreator from "@/components/admin/TickerAlertCreator";
import SubscriptionManager from "@/components/admin/SubscriptionManager";
import TradeableSignals from "@/components/admin/TradeableSignals";

// Configure admin emails
const ADMIN_EMAILS = ["achen1076@gmail.com"];

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      watchlists: {
        include: {
          items: true,
        },
        orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  const activeWatchlist = user?.watchlists.find(
    (w) => w.id === user?.activeWatchlistId,
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">You shouldnt be here</p>
        </div>

        <WatchlistSelector
          watchlists={user?.watchlists ?? []}
          activeWatchlist={activeWatchlist ?? null}
          showManageButton
        />

        <TradeableSignals />

        <SubscriptionManager />
        <LambdaCronRunner />
        <NewsProcessor />
        {/* <QuantScriptRunner />
        <SentinelRunner /> */}
        <SentimentAlertsTester watchlistId={activeWatchlist?.id} />
        <TickerAlertCreator />
      </div>
    </div>
  );
}
