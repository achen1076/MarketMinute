import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { invalidateWatchlistCaches } from "@shared/lib/request-cache";

/**
 * Toggle favorite status for a watchlist item
 * POST /api/watchlist-items/favorite
 * Body: { itemId: string, isFavorite: boolean }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { itemId, isFavorite } = await req.json();

    if (!itemId || typeof isFavorite !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    // Verify the item belongs to one of the user's watchlists
    const item = await prisma.watchlistItem.findUnique({
      where: { id: itemId },
      include: {
        watchlist: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!item || item.watchlist.user.email !== session.user.email) {
      return NextResponse.json(
        { error: "Watchlist item not found or access denied" },
        { status: 404 }
      );
    }

    // Update the favorite status
    const updatedItem = await prisma.watchlistItem.update({
      where: { id: itemId },
      data: { isFavorite },
    });

    // Invalidate cache
    await invalidateWatchlistCaches(item.watchlist.id);

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error("[API] Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to update favorite status" },
      { status: 500 }
    );
  }
}
