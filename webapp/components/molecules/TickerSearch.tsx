"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";

type Ticker = {
  symbol: string;
  name: string;
};

type Props = {
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
  disabled?: boolean;
  maxSymbols?: number;
};

export default function TickerSearch({
  selectedSymbols,
  onSymbolsChange,
  disabled = false,
  maxSymbols,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredTickers, setFilteredTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep refs to latest values to avoid stale closures when adding symbols quickly
  const selectedSymbolsRef = useRef(selectedSymbols);
  const onSymbolsChangeRef = useRef(onSymbolsChange);

  useEffect(() => {
    selectedSymbolsRef.current = selectedSymbols;
  }, [selectedSymbols]);

  useEffect(() => {
    onSymbolsChangeRef.current = onSymbolsChange;
  }, [onSymbolsChange]);

  // Search tickers from API
  useEffect(() => {
    if (searchQuery.length < 1) {
      setFilteredTickers([]);
      return;
    }

    const searchTickers = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/ticker-search?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        const tickers: Ticker[] = (data.quotes || []).map((q: any) => ({
          symbol: q.symbol,
          name: q.name,
        }));
        setFilteredTickers(tickers);
      } catch (error) {
        console.error("Failed to search tickers:", error);
        setFilteredTickers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchTickers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddSymbol = useCallback((symbol: string, limit?: number) => {
    const current = selectedSymbolsRef.current;
    // Check limit before adding
    if (limit !== undefined && current.length >= limit) {
      return;
    }
    if (!current.includes(symbol)) {
      onSymbolsChangeRef.current([...current, symbol]);
    }
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  }, []);

  const handleRemoveSymbol = useCallback((symbol: string) => {
    onSymbolsChangeRef.current(
      selectedSymbolsRef.current.filter((s) => s !== symbol)
    );
  }, []);

  const isAtLimit =
    maxSymbols !== undefined && selectedSymbols.length >= maxSymbols;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      if (isAtLimit) return;
      if (filteredTickers.length > 0) {
        handleAddSymbol(filteredTickers[0].symbol, maxSymbols);
      } else {
        // Allow manual entry
        const symbol = searchQuery.trim().toUpperCase();
        if (symbol && !selectedSymbolsRef.current.includes(symbol)) {
          handleAddSymbol(symbol, maxSymbols);
        }
      }
      // } else if (
      //   e.key === "Backspace" &&
      //   searchQuery === "" &&
      //   selectedSymbolsRef.current.length > 0
      // ) {
      //   // Remove last symbol on backspace when input is empty
      //   handleRemoveSymbol(
      //     selectedSymbolsRef.current[selectedSymbolsRef.current.length - 1]
      //   );
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Symbols Display */}
      {selectedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/50 p-3">
          {selectedSymbols.map((symbol) => (
            <div
              key={symbol}
              className="group flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-emerald-400 transition-colors hover:bg-emerald-400/25"
            >
              <span>{symbol}</span>
              <button
                type="button"
                onClick={() => handleRemoveSymbol(symbol)}
                disabled={disabled}
                className="rounded-full p-0.5 transition-colors hover:bg-rose-400 text-foreground disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => searchQuery && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for stocks (e.g. AAPL, Tesla, Microsoft)..."
          disabled={disabled}
          className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:opacity-50"
        />

        {/* Dropdown */}
        {showDropdown && searchQuery && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-xl"
          >
            {loading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : filteredTickers.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {isAtLimit && (
                  <div className="px-4 py-2 text-xs text-amber-400 bg-amber-500/10 border-b border-border">
                    Limit of {maxSymbols} symbols reached
                  </div>
                )}
                {filteredTickers.map((ticker) => (
                  <button
                    key={ticker.symbol}
                    type="button"
                    onClick={() => handleAddSymbol(ticker.symbol, maxSymbols)}
                    disabled={
                      selectedSymbols.includes(ticker.symbol) || isAtLimit
                    }
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="font-semibold text-foreground">
                        {ticker.symbol}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {ticker.name}
                      </div>
                    </div>
                    {selectedSymbols.includes(ticker.symbol) && (
                      <span className="ml-2 text-xs text-emerald-500">
                        Added
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  No stocks found. Press Enter to add "
                  {searchQuery.toUpperCase()}" manually.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p
        className={`text-xs ${
          isAtLimit ? "text-amber-400" : "text-muted-foreground"
        }`}
      >
        {selectedSymbols.length === 0
          ? "Start typing to search for stocks, or press Enter to add symbols manually"
          : maxSymbols
          ? `${selectedSymbols.length}/${maxSymbols} symbols (free tier)${
              isAtLimit ? " (limit reached)" : ""
            }`
          : `${selectedSymbols.length} symbol`}
      </p>
    </div>
  );
}
