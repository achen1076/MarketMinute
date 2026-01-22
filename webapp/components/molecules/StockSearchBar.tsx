"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
};

export function StockSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 1) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/ticker-search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.quotes || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (symbol: string) => {
    setQuery("");
    setShowResults(false);
    router.push(`/analyze?symbol=${symbol}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (results.length > 0) {
      handleSelect(results[0].symbol);
    } else {
      setShowResults(false);
      router.push(`/analyze?symbol=${query.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-2 mb-4">
        <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Stock Search
        </div>
        <p className="text-sm text-muted-foreground">
          Search any stock to run EGE analysis
        </p>
      </div>

      <div ref={searchRef} className="w-full relative">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="Search by ticker or company name..."
              className="w-full pl-12 pr-4 py-4 bg-card border-2 border-border rounded-xl text-base text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </form>

        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {results.length > 0 ? (
                results.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelect(result.symbol)}
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
                  Press Enter to search for &quot;{query.toUpperCase()}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
