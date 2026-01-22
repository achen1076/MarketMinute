"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/atoms/Card";
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { isMarketOpen, isAfterHours, isPreMarket } from "@shared/lib/marketHours";

type IndexData = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

type NewsItem = {
  id: string;
  title: string;
  summary?: string;
  publisher: string;
  url: string;
  publishedAt: string;
  thumbnail?: string;
};

type TrendingStock = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
  { symbol: "JPM", name: "JPMorgan" },
];

// Refresh intervals in milliseconds
const MARKET_OPEN_REFRESH = 5 * 60 * 1000; // 5 minutes
const MARKET_CLOSED_REFRESH = 60 * 60 * 1000; // 1 hour
const WEEKEND_REFRESH = 4 * 60 * 60 * 1000; // 4 hours on weekends

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

export default function StockSearchClient() {
  const router = useRouter();
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsPage, setNewsPage] = useState(0);
  const [totalNewsPages, setTotalNewsPages] = useState(0);
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNews = useCallback(async (page: number) => {
    setNewsLoading(true);
    try {
      const res = await fetch(`/api/market-news?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
        setNewsPage(data.page || 0);
        setTotalNewsPages(data.totalPages || 0);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const fetchIndicesAndStocks = useCallback(async () => {
    try {
      const [indicesRes, quotesRes] = await Promise.all([
        fetch("/api/indices"),
        fetch(
          `/api/batch-quotes?symbols=${POPULAR_STOCKS.map((s) => s.symbol).join(
            ","
          )}`
        ),
      ]);

      if (indicesRes.ok) {
        const data = await indicesRes.json();
        setIndices(data.indices || []);
      }

      if (quotesRes.ok) {
        const data = await quotesRes.json();
        const stocks = (data.quotes || [])
          .map((q: any) => ({
            symbol: q.symbol,
            name:
              q.name ||
              POPULAR_STOCKS.find((p) => p.symbol === q.symbol)?.name ||
              q.symbol,
            price: q.price,
            changePct: q.changePct || q.changePercentage || 0,
          }))
          .sort(
            (a: TrendingStock, b: TrendingStock) =>
              Math.abs(b.changePct) - Math.abs(a.changePct)
          );
        setTrendingStocks(stocks);
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchIndicesAndStocks(), fetchNews(0)]);
    } finally {
      setLoading(false);
    }
  }, [fetchIndicesAndStocks, fetchNews]);

  const handlePrevPage = () => {
    if (newsPage > 0) {
      fetchNews(newsPage - 1);
    }
  };

  const handleNextPage = () => {
    if (newsPage < totalNewsPages - 1) {
      fetchNews(newsPage + 1);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh with smart intervals
  useEffect(() => {
    const getRefreshInterval = () => {
      if (isWeekend()) {
        return WEEKEND_REFRESH;
      }
      const marketActive = isMarketOpen() || isAfterHours() || isPreMarket();
      return marketActive ? MARKET_OPEN_REFRESH : MARKET_CLOSED_REFRESH;
    };

    const setupRefresh = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const refreshInterval = getRefreshInterval();

      intervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchIndicesAndStocks();
        }
      }, refreshInterval);
    };

    setupRefresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchIndicesAndStocks();
        setupRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchIndicesAndStocks]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  const handleStockClick = (symbol: string) => {
    router.push(`/stock/${symbol}`);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-muted rounded-xl" />
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Major Indices */}
      {indices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {indices.map((index) => {
            const isPositive = index.changePct >= 0;
            return (
              <Card
                key={index.symbol}
                className="p-5 cursor-pointer hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {index.name}
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {index.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${
                      isPositive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {isPositive ? "+" : ""}
                    {index.changePct.toFixed(2)}%
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Headlines */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-8">
            <Newspaper className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Market Headlines
            </h3>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse flex gap-3 p-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="w-16 h-12 bg-muted rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 p-4 -m-3 rounded-lg hover:bg-muted/50 transition-colors"
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
                    <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No headlines available
            </div>
          )}

          {/* Pagination */}
          {totalNewsPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6 pt-4">
              <button
                onClick={handlePrevPage}
                disabled={newsPage === 0 || newsLoading}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                Page {newsPage + 1} of {totalNewsPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={newsPage >= totalNewsPages - 1 || newsLoading}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          )}
        </Card>

        {/* Trending Stocks */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="text-lg font-semibold text-foreground">
              Popular Stocks
            </h3>
          </div>

          <div className="">
            {trendingStocks.length > 0 ? (
              trendingStocks.map((stock) => {
                const isPositive = stock.changePct >= 0;
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => handleStockClick(stock.symbol)}
                    className="w-full flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground">
                        {stock.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {stock.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        ${stock.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {stock.changePct.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Loading stocks...
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
