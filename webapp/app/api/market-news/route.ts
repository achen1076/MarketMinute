import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redis } from "@/lib/redis";
import { isMarketOpen } from "@/lib/marketHours";

type FMPNewsItem = {
  symbol: string | null;
  publishedDate: string;
  publisher: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
};

type FormattedNewsItem = {
  id: string;
  title: string;
  summary: string;
  publisher: string;
  url: string;
  publishedAt: string;
  thumbnail?: string;
};

// Cache TTLs in seconds
const MARKET_OPEN_CACHE_TTL = 300; // 5 minutes
const MARKET_CLOSED_CACHE_TTL = 3600; // 1 hour
const WEEKEND_CACHE_TTL = 14400; // 4 hours on weekends
const CACHE_KEY = "market:news:general";

let memoryCache: { data: FormattedNewsItem[]; timestamp: number } | null = null;

function isWeekend(): boolean {
  const now = new Date();
  const day = now.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(): { from: string; to: string } {
  const now = new Date();
  const to = formatDate(now);

  // Get news from the last 2 days (covers weekend gaps)
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 2);
  const from = formatDate(fromDate);

  return { from, to };
}

function getCacheTTL(): number {
  if (isWeekend()) {
    return WEEKEND_CACHE_TTL;
  }
  return isMarketOpen() ? MARKET_OPEN_CACHE_TTL : MARKET_CLOSED_CACHE_TTL;
}

const ITEMS_PER_PAGE = 10;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0"));

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[MarketNews] FMP_API_KEY not configured");
    return NextResponse.json({ news: [], page: 0, totalPages: 0 });
  }

  const marketOpen = isMarketOpen();
  const weekend = isWeekend();
  const cacheTTL = getCacheTTL();

  let allNews: FormattedNewsItem[] | null = null;

  if (redis) {
    try {
      allNews = await redis.get<FormattedNewsItem[]>(CACHE_KEY);
      if (allNews) {
        console.log(`[MarketNews/Redis] Cache hit, ${allNews.length} items`);
        const totalPages = Math.ceil(allNews.length / ITEMS_PER_PAGE);
        const paginatedNews = allNews.slice(
          page * ITEMS_PER_PAGE,
          (page + 1) * ITEMS_PER_PAGE
        );
        return NextResponse.json({
          news: paginatedNews,
          page,
          totalPages,
          totalItems: allNews.length,
          cached: true,
          marketOpen,
          weekend,
        });
      }
    } catch (error) {
      console.error("[MarketNews] Redis fetch error:", error);
    }
  } else {
    const now = Date.now();
    const maxAge = cacheTTL * 1000;
    if (memoryCache && now - memoryCache.timestamp < maxAge) {
      console.log(
        `[MarketNews/Memory] Cache hit, ${memoryCache.data.length} items`
      );
      const totalPages = Math.ceil(memoryCache.data.length / ITEMS_PER_PAGE);
      const paginatedNews = memoryCache.data.slice(
        page * ITEMS_PER_PAGE,
        (page + 1) * ITEMS_PER_PAGE
      );
      return NextResponse.json({
        news: paginatedNews,
        page,
        totalPages,
        totalItems: memoryCache.data.length,
        cached: true,
        marketOpen,
        weekend,
      });
    }
  }

  try {
    const { from, to } = getDateRange();
    const url = new URL(
      "https://financialmodelingprep.com/stable/news/general-latest"
    );
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    url.searchParams.set("apikey", apiKey);

    console.log(`[MarketNews] Fetching news from ${from} to ${to}`);

    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      console.error(`[MarketNews] FMP API error: ${res.status}`);
      return NextResponse.json({
        news: [],
        page: 0,
        totalPages: 0,
        error: "Failed to fetch news",
      });
    }

    const data: FMPNewsItem[] = await res.json();

    if (!Array.isArray(data)) {
      console.error("[MarketNews] Invalid response:", data);
      return NextResponse.json({ news: [], page: 0, totalPages: 0 });
    }

    const formattedNews: FormattedNewsItem[] = data
      .filter((item) => item.title && item.url)
      .map((item, index) => ({
        id: `fmp-${index}-${Date.now()}`,
        title: item.title,
        summary: item.text || "",
        publisher: item.publisher || item.site || "Unknown",
        url: item.url,
        publishedAt: item.publishedDate,
        thumbnail: item.image || undefined,
      }));

    if (redis) {
      try {
        await redis.setex(CACHE_KEY, cacheTTL, formattedNews);
        console.log(
          `[MarketNews/Redis] Cached ${formattedNews.length} items for ${cacheTTL}s (weekend: ${weekend})`
        );
      } catch (error) {
        console.error("[MarketNews] Redis write error:", error);
      }
    } else {
      memoryCache = { data: formattedNews, timestamp: Date.now() };
      console.log(
        `[MarketNews/Memory] Cached ${formattedNews.length} items for ${cacheTTL}s (weekend: ${weekend})`
      );
    }

    const totalPages = Math.ceil(formattedNews.length / ITEMS_PER_PAGE);
    const paginatedNews = formattedNews.slice(
      page * ITEMS_PER_PAGE,
      (page + 1) * ITEMS_PER_PAGE
    );

    return NextResponse.json({
      news: paginatedNews,
      page,
      totalPages,
      totalItems: formattedNews.length,
      cached: false,
      marketOpen,
      weekend,
    });
  } catch (error) {
    console.error("[MarketNews] Error:", error);
    return NextResponse.json({
      news: [],
      page: 0,
      totalPages: 0,
      error: "Failed to fetch news",
    });
  }
}
