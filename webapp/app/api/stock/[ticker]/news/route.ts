import { NextResponse } from "next/server";
import { auth } from "@/auth";

type YahooNewsItem = {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  type: string;
  thumbnail?: {
    resolutions: { url: string; width: number; height: number; tag: string }[];
  };
  relatedTickers?: string[];
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { ticker } = await params;

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        ticker
      )}&quotesCount=1&newsCount=12`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch from Yahoo Finance");
    }

    const data = await res.json();
    const news = (data.news || []) as YahooNewsItem[];

    // Format the news items
    const formattedNews = news
      .filter((item) => item.title && item.link)
      .map((item) => ({
        id: item.uuid,
        title: item.title,
        publisher: item.publisher,
        url: item.link,
        publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
        thumbnail: item.thumbnail?.resolutions?.find((r) => r.tag === "140x140")
          ?.url,
        thumbnailLarge: item.thumbnail?.resolutions?.find(
          (r) => r.tag === "original"
        )?.url,
        relatedTickers: item.relatedTickers || [],
      }));

    return NextResponse.json({ news: formattedNews });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json({ news: [], error: "Failed to fetch news" });
  }
}
