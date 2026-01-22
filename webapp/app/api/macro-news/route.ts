import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMacroNews } from "@shared/lib/macroNews";

/**
 * API endpoint to fetch macro economic news
 * GET /api/macro-news?maxItems=10
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const maxItems = parseInt(searchParams.get("maxItems") || "10");

    const macroNews = await getMacroNews(maxItems);

    return NextResponse.json({
      news: macroNews,
      fetchedAt: Date.now(),
    });
  } catch (error) {
    console.error("[MacroNews] Error fetching macro news:", error);
    return NextResponse.json(
      { error: "Failed to fetch macro news" },
      { status: 500 }
    );
  }
}
