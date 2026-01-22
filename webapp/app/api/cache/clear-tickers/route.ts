import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redis } from "@shared/lib/redis";

/**
 * Clear ticker cache (admin only)
 * Useful for debugging stale price data
 */
export async function POST() {
  const session = await auth();

  // Only allow admin users
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!redis) {
    return NextResponse.json(
      { error: "Redis not configured" },
      { status: 500 }
    );
  }

  try {
    // Find all ticker cache keys and delete them
    const keys = await redis.keys("ticker:*");

    let deletedCount = 0;
    if (keys.length > 0) {
      // Delete in batches to avoid command size limits
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await redis.del(...batch);
        deletedCount += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      clearedKeys: deletedCount,
      message: `Cleared ${deletedCount} ticker cache entries`,
    });
  } catch (error) {
    console.error("[Cache] Error clearing ticker cache:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
