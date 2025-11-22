import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuantScriptRunner from "@/components/organisms/QuantScriptRunner";
import WatchlistSelector from "@/components/organisms/WatchlistSelector";
import SentinelRunner from "@/components/organisms/SentinelRunner";

// Configure admin emails
const ADMIN_EMAILS = ["achen1076@gmail.com"];

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
    (w) => w.id === user?.activeWatchlistId
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Admin Panel
          </h1>
          <p className="text-slate-400">Manage quant models and predictions</p>
        </div>

        <WatchlistSelector
          watchlists={user?.watchlists ?? []}
          activeWatchlist={activeWatchlist ?? null}
          showManageButton
        />

        <QuantScriptRunner />
        <SentinelRunner />
      </div>
    </div>
  );
}
