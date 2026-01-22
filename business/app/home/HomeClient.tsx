"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ArrowRight,
  Star,
} from "lucide-react";
import { WatchlistSelector } from "@shared/components/organisms/WatchlistSelector";
import { TickerChart } from "@shared/components/molecules/TickerChart";
import type { TickerSnapshot } from "@shared/lib/marketData";

type WatchlistItem = {
  id: string;
  symbol: string;
  notes?: string | null;
  order: number;
  isFavorite: boolean;
};

type Watchlist = {
  id: string;
  name: string;
  items: WatchlistItem[];
  isFavorite: boolean;
};

type EnrichedSnapshot = TickerSnapshot & {
  isFavorite?: boolean;
  itemId?: string | null;
};

type IndexData = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

type NewsItem = {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  thumbnail?: string;
  url: string;
};

type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
};

type Props = {
  watchlists: Watchlist[];
  activeWatchlist: Watchlist | null;
  initialSnapshots: EnrichedSnapshot[];
};

export function HomeClient({
  watchlists,
  activeWatchlist,
  initialSnapshots,
}: Props) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [snapshots, setSnapshots] =
    useState<EnrichedSnapshot[]>(initialSnapshots);
  const [currentWatchlist, setCurrentWatchlist] = useState<Watchlist | null>(
    activeWatchlist
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Market data state
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsPage, setNewsPage] = useState(0);
  const [totalNewsPages, setTotalNewsPages] = useState(0);
  const [loadingNews, setLoadingNews] = useState(false);

  // Selected stock for detailed view
  const [selectedStock, setSelectedStock] = useState<EnrichedSnapshot | null>(
    null
  );
  const [sortOrder, setSortOrder] = useState<"A-Z" | "change">("A-Z");

  useEffect(() => {
    setSnapshots(initialSnapshots);
    setCurrentWatchlist(activeWatchlist);
    // Auto-select first stock if available
    if (initialSnapshots.length > 0 && !selectedStock) {
      setSelectedStock(initialSnapshots[0]);
    }
  }, [initialSnapshots, activeWatchlist]);

  // Fetch indices on mount
  useEffect(() => {
    fetchIndices();
    fetchNews(0);
  }, []);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchIndices = async () => {
    try {
      const res = await fetch("/api/indices");
      if (res.ok) {
        const data = await res.json();
        setIndices(data.indices || []);
      }
    } catch (error) {
      console.error("Failed to fetch indices:", error);
    }
  };

  const fetchNews = async (page: number) => {
    setLoadingNews(true);
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
      setLoadingNews(false);
    }
  };

  // Search with debounce
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/ticker-search?q=${encodeURIComponent(searchQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.quotes || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (symbol: string) => {
    setSearchQuery("");
    setShowResults(false);
    router.push(`/analyze?symbol=${symbol}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (searchResults.length > 0) {
      handleSelectSearchResult(searchResults[0].symbol);
    } else {
      router.push(`/analyze?symbol=${searchQuery.trim().toUpperCase()}`);
    }
  };

  const handleSelectWatchlistStock = (stock: EnrichedSnapshot) => {
    setSelectedStock(stock);
  };

  const handleAnalyzeStock = (symbol: string) => {
    router.push(`/analyze?symbol=${symbol}`);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours === 1) return "1h ago";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    return `${diffDays}d ago`;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatVolume = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Sort snapshots
  const sortedSnapshots = [...snapshots].sort((a, b) => {
    if (sortOrder === "A-Z") {
      return a.symbol.localeCompare(b.symbol);
    }
    return Math.abs(b.changePct) - Math.abs(a.changePct);
  });

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Stock Search
        </h1>
        <p className="text-sm text-muted-foreground">
          Search any stock for real-time data and AI insights
        </p>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} className="relative">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Search by ticker or company name..."
              className="w-full pl-12 pr-4 py-4 bg-card border-2 border-border rounded-xl text-base text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              autoComplete="off"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </form>

        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectSearchResult(result.symbol)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground min-w-[50px]">
                        {result.symbol}
                      </span>
                      <span className="text-muted-foreground text-sm truncate max-w-[280px]">
                        {result.name}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-muted-foreground">
                  Press Enter to search for &quot;{searchQuery.toUpperCase()}
                  &quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Market Indices */}
      {indices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {indices.map((index) => (
            <div
              key={index.symbol}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">
                  {index.name}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                    index.changePct >= 0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {index.changePct >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {index.changePct >= 0 ? "+" : ""}
                  {index.changePct.toFixed(2)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(index.price)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Headlines */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Newspaper className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Market Headlines
            </h2>
          </div>

          {loadingNews ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 p-3 -m-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-emerald-400 transition-colors mb-1">
                        {item.title}
                      </h3>
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

              {totalNewsPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4">
                  <button
                    onClick={() => fetchNews(newsPage - 1)}
                    disabled={newsPage === 0 || loadingNews}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                    Page {newsPage + 1} of {totalNewsPages}
                  </span>
                  <button
                    onClick={() => fetchNews(newsPage + 1)}
                    disabled={newsPage >= totalNewsPages - 1 || loadingNews}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Watchlist Sidebar */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">
                Your Symbols
              </h2>
            </div>

            <WatchlistSelector
              watchlists={watchlists}
              activeWatchlist={currentWatchlist}
              showManageButton={true}
            />

            {/* Sort dropdown */}
            {snapshots.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "A-Z" ? "change" : "A-Z")
                  }
                  className="flex items-center gap-2 px-3 py-2 w-full bg-muted/50 hover:bg-muted rounded-lg text-sm text-foreground transition-colors"
                >
                  <span>{sortOrder === "A-Z" ? "A-Z" : "% Change"}</span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </button>
              </div>
            )}
          </div>

          {/* Stock List & Detail */}
          <div className="max-h-[600px] overflow-y-auto">
            {!currentWatchlist ? (
              <div className="text-center py-8 px-4">
                <p className="text-muted-foreground text-sm mb-4">
                  {watchlists.length > 0
                    ? "Select a watchlist to view stocks"
                    : "Create a watchlist to track stocks"}
                </p>
                <a
                  href="/watchlist"
                  className="inline-block px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition-colors"
                >
                  {watchlists.length > 0
                    ? "Manage Watchlists"
                    : "Create Watchlist"}
                </a>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-muted-foreground text-sm">
                  No stocks in this watchlist yet
                </p>
              </div>
            ) : (
              <div>
                {sortedSnapshots.map((stock) => {
                  const isSelected = selectedStock?.symbol === stock.symbol;
                  const isPositive = stock.changePct >= 0;

                  return (
                    <div
                      key={stock.symbol}
                      className="border-b border-border last:border-b-0"
                    >
                      {/* Stock Row */}
                      <button
                        onClick={() => handleSelectWatchlistStock(stock)}
                        className={`w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left ${
                          isSelected ? "bg-muted/30" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {stock.isFavorite && (
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">
                                {stock.symbol}
                              </span>
                              {stock.extendedHoursSession && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">
                                  {stock.extendedHoursSession === "premarket"
                                    ? "Pre"
                                    : "After"}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {stock.name || stock.symbol}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-semibold ${
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {stock.changePct.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            at close
                          </div>
                        </div>
                      </button>

                      {/* Expanded Detail View */}
                      {isSelected && (
                        <div className="px-4 pb-4 space-y-4 bg-muted/20">
                          {/* Price Header */}
                          <div className="pt-2">
                            <div className="text-2xl font-bold text-foreground">
                              ${formatPrice(stock.price)}
                            </div>
                            {stock.extendedHoursPrice !== undefined && (
                              <div className="flex items-center gap-2 text-sm mt-1">
                                <span className="text-violet-400">
                                  {stock.extendedHoursSession === "premarket"
                                    ? "Pre-market"
                                    : "After-hours"}
                                  :
                                </span>
                                <span className="text-foreground">
                                  ${formatPrice(stock.extendedHoursPrice)}
                                </span>
                                {stock.extendedHoursChangePct !== undefined && (
                                  <span
                                    className={
                                      stock.extendedHoursChangePct >= 0
                                        ? "text-emerald-400"
                                        : "text-rose-400"
                                    }
                                  >
                                    {stock.extendedHoursChangePct >= 0
                                      ? "+"
                                      : ""}
                                    {stock.extendedHoursChangePct.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Analyze Button */}
                          <button
                            onClick={() => handleAnalyzeStock(stock.symbol)}
                            className="w-full py-2 px-4 bg-muted hover:bg-muted/80 rounded-lg text-sm text-foreground transition-colors flex items-center justify-center gap-2"
                          >
                            <span>Why this moved</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* Chart */}
                          <TickerChart
                            symbol={stock.symbol}
                            currentPrice={stock.price}
                            changePct={stock.changePct}
                            previousClose={stock.previousClose}
                          />

                          {/* Extended Hours Quote */}
                          {stock.extendedHoursSession && (
                            <div className="pt-4 border-t border-border">
                              <h4 className="text-sm font-semibold text-emerald-400 mb-3">
                                {stock.extendedHoursSession === "premarket"
                                  ? "Pre-market"
                                  : "After-hours"}{" "}
                                Quote
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {stock.extendedHoursBid !== undefined && (
                                  <div>
                                    <div className="text-muted-foreground text-xs">
                                      Bid
                                    </div>
                                    <div className="text-emerald-400 font-medium">
                                      ${formatPrice(stock.extendedHoursBid)}
                                      {stock.extendedHoursBidSize &&
                                        ` x ${stock.extendedHoursBidSize}`}
                                    </div>
                                  </div>
                                )}
                                {stock.extendedHoursAsk !== undefined && (
                                  <div>
                                    <div className="text-muted-foreground text-xs">
                                      Ask
                                    </div>
                                    <div className="text-rose-400 font-medium">
                                      ${formatPrice(stock.extendedHoursAsk)}
                                      {stock.extendedHoursAskSize &&
                                        ` x ${stock.extendedHoursAskSize}`}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Stats Grid */}
                          <div className="pt-4 border-t border-border">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {stock.marketCap !== undefined &&
                                stock.marketCap > 0 && (
                                  <div>
                                    <div className="text-muted-foreground text-xs">
                                      Market Cap
                                    </div>
                                    <div className="text-foreground font-medium">
                                      {formatLargeNumber(stock.marketCap)}
                                    </div>
                                  </div>
                                )}
                              {stock.volume !== undefined &&
                                stock.volume > 0 && (
                                  <div>
                                    <div className="text-muted-foreground text-xs">
                                      Volume
                                    </div>
                                    <div className="text-foreground font-medium">
                                      {formatVolume(stock.volume)}
                                    </div>
                                  </div>
                                )}
                              {stock.open !== undefined && (
                                <div>
                                  <div className="text-muted-foreground text-xs">
                                    Open
                                  </div>
                                  <div className="text-foreground font-medium">
                                    ${formatPrice(stock.open)}
                                  </div>
                                </div>
                              )}
                              {stock.previousClose !== undefined && (
                                <div>
                                  <div className="text-muted-foreground text-xs">
                                    Prev Close
                                  </div>
                                  <div className="text-foreground font-medium">
                                    ${formatPrice(stock.previousClose)}
                                  </div>
                                </div>
                              )}
                              {stock.dayLow !== undefined && (
                                <div>
                                  <div className="text-muted-foreground text-xs">
                                    Day Low
                                  </div>
                                  <div className="text-foreground font-medium">
                                    ${formatPrice(stock.dayLow)}
                                  </div>
                                </div>
                              )}
                              {stock.dayHigh !== undefined && (
                                <div>
                                  <div className="text-muted-foreground text-xs">
                                    Day High
                                  </div>
                                  <div className="text-foreground font-medium">
                                    ${formatPrice(stock.dayHigh)}
                                  </div>
                                </div>
                              )}
                              {stock.low52w !== undefined && (
                                <div>
                                  <div className="text-muted-foreground text-xs">
                                    52W Low
                                  </div>
                                  <div className="text-foreground font-medium">
                                    ${formatPrice(stock.low52w)}
                                  </div>
                                </div>
                              )}
                              {stock.high52w !== undefined && (
                                <div>
                                  <div className="text-muted-foreground text-xs">
                                    52W High
                                  </div>
                                  <div className="text-foreground font-medium">
                                    ${formatPrice(stock.high52w)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
