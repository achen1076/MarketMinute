"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

type Ticker = {
  symbol: string;
  name: string;
};

type Props = {
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
  disabled?: boolean;
};

export default function TickerSearch({
  selectedSymbols,
  onSymbolsChange,
  disabled = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredTickers, setFilteredTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleAddSymbol = (symbol: string) => {
    if (!selectedSymbols.includes(symbol)) {
      onSymbolsChange([...selectedSymbols, symbol]);
    }
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveSymbol = (symbol: string) => {
    onSymbolsChange(selectedSymbols.filter((s) => s !== symbol));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      if (filteredTickers.length > 0) {
        handleAddSymbol(filteredTickers[0].symbol);
      } else {
        // Allow manual entry
        const symbol = searchQuery.trim().toUpperCase();
        if (symbol && !selectedSymbols.includes(symbol)) {
          handleAddSymbol(symbol);
        }
      }
    } else if (
      e.key === "Backspace" &&
      searchQuery === "" &&
      selectedSymbols.length > 0
    ) {
      // Remove last symbol on backspace when input is empty
      handleRemoveSymbol(selectedSymbols[selectedSymbols.length - 1]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Symbols Display */}
      {selectedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
          {selectedSymbols.map((symbol) => (
            <div
              key={symbol}
              className="group flex items-center gap-1.5 rounded-full bg-emerald-900/30 px-3 py-1.5 text-sm font-medium text-emerald-300 ring-1 ring-emerald-700/50 transition-colors hover:bg-emerald-900/50"
            >
              <span>{symbol}</span>
              <button
                type="button"
                onClick={() => handleRemoveSymbol(symbol)}
                disabled={disabled}
                className="rounded-full p-0.5 transition-colors hover:bg-emerald-800 disabled:opacity-50"
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
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500 disabled:opacity-50"
        />

        {/* Dropdown */}
        {showDropdown && searchQuery && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl"
          >
            {loading ? (
              <div className="px-4 py-3 text-sm text-slate-400">
                Searching...
              </div>
            ) : filteredTickers.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {filteredTickers.map((ticker) => (
                  <button
                    key={ticker.symbol}
                    type="button"
                    onClick={() => handleAddSymbol(ticker.symbol)}
                    disabled={selectedSymbols.includes(ticker.symbol)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="font-semibold text-slate-100">
                        {ticker.symbol}
                      </div>
                      <div className="truncate text-xs text-slate-400">
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
                <div className="text-sm text-slate-400">
                  No stocks found. Press Enter to add "{searchQuery.toUpperCase()}" manually.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-slate-500">
        {selectedSymbols.length === 0
          ? "Start typing to search for stocks, or press Enter to add symbols manually"
          : `${selectedSymbols.length} symbol${selectedSymbols.length === 1 ? "" : "s"} selected`}
      </p>
    </div>
  );
}
