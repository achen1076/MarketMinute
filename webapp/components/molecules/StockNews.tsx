"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import Card from "@/components/atoms/Card";

type NewsItem = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  thumbnail?: string;
  thumbnailLarge?: string;
  relatedTickers: string[];
};

type NewsCategory = "all" | "news" | "earnings" | "press" | "sec";

type Props = {
  ticker: string;
};

export function StockNews({ ticker }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("all");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stock/${ticker}/news`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Filter news based on category (simple keyword matching)
  const filteredNews = news.filter((item) => {
    if (activeCategory === "all") return true;
    const title = item.title.toLowerCase();
    const publisher = item.publisher.toLowerCase();

    switch (activeCategory) {
      case "earnings":
        return (
          title.includes("earning") ||
          title.includes("q1") ||
          title.includes("q2") ||
          title.includes("q3") ||
          title.includes("q4") ||
          title.includes("revenue") ||
          title.includes("profit")
        );
      case "press":
        return (
          title.includes("announce") ||
          title.includes("launch") ||
          title.includes("partner") ||
          title.includes("deal") ||
          title.includes("agreement")
        );
      case "sec":
        return (
          title.includes("sec") ||
          title.includes("filing") ||
          title.includes("10-k") ||
          title.includes("10-q") ||
          title.includes("8-k")
        );
      default:
        return true;
    }
  });

  const categories: { id: NewsCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "news", label: "News" },
    { id: "earnings", label: "Earnings Calls" },
    { id: "press", label: "Press Releases" },
    { id: "sec", label: "SEC Filings" },
  ];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Recent News: {ticker}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-20 h-20 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Recent News: {ticker}
        </h3>
        <a
          href={`https://finance.yahoo.com/quote/${ticker}/news`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          View More
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNews.slice(0, 10).map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {item.publisher} • {formatTimeAgo(item.publishedAt)}
              </p>
            </div>
            {item.thumbnail && (
              <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </a>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No {activeCategory === "all" ? "" : activeCategory} news found for{" "}
          {ticker}
        </p>
      )}
    </Card>
  );
}
