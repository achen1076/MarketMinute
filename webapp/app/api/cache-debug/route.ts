import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/tickerCache";

/**
 * Debug endpoint to view ticker cache statistics
 * Access at: /api/cache-debug
 */
export async function GET() {
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
