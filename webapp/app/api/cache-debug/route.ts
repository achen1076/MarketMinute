import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/tickerCache";
import { auth } from "@/auth";

/**
 * Debug endpoint to view ticker cache statistics
 * Access at: /api/cache-debug
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const stats = getCacheStats();

  return NextResponse.json({
    cacheSize: stats.size,
    cachedTickers: stats.tickers,
    message:
      stats.size > 0
        ? `${stats.size} tickers currently cached`
        : "Cache is empty - no tickers fetched yet",
    timestamp: new Date().toISOString(),
  });
}
