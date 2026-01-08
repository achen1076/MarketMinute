import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCachedSnapshots } from "@/lib/tickerCache";
import {
  checkRateLimit,
  RateLimitPresets,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  if (!symbol || symbol.length === 0) {
    return NextResponse.json({ error: "Ticker required" }, { status: 400 });
  }

  const rateLimitResult = checkRateLimit(
    "stock-detail",
    session.user.email,
    RateLimitPresets.DATA_FETCH
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { snapshots, cacheStats } = await getCachedSnapshots([symbol]);
    const snapshot = snapshots[0];

    if (!snapshot || snapshot.price === 0) {
      return NextResponse.json(
        { error: "Stock not found or data unavailable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { snapshot },
      {
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          "X-Cache-Hit": cacheStats.hits > 0 ? "true" : "false",
        },
      }
    );
  } catch (error) {
    console.error(`[Stock API] Error fetching ${symbol}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
