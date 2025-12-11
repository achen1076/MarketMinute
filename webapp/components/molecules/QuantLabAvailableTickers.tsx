"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import { ChevronDown, ChevronUp, Info, Search } from "lucide-react";

// Tickers from quant/lambda/tickers.py
const AVAILABLE_TICKERS = [
  "AAPL",
  "MSFT",
  "AMZN",
  "NVDA",
  "GOOGL",
  "META",
  "TSLA",
  "AVGO",
  "LLY",
  "JPM",
  "V",
  "MA",
  "UNH",
  "XOM",
  "PG",
  "HD",
  "MRK",
  "ABBV",
  "COST",
  "BAC",
  "ADBE",
  "KO",
  "PEP",
  "ORCL",
  "NFLX",
  "CSCO",
  "TMO",
  "ACN",
  "CRM",
  "PFE",
  "AMD",
  "WMT",
  "QCOM",
  "TXN",
  "MCD",
  "AMAT",
  "NEE",
  "UPS",
  "IBM",
  "LOW",
  "LIN",
  "UNP",
  "SPGI",
  "RTX",
  "CAT",
  "COP",
  "PM",
  "GE",
  "HON",
  "DHR",
  "AMGN",
  "MS",
  "BKNG",
  "DE",
  "LMT",
  "SCHW",
  "NOW",
  "BMY",
  "MDT",
  "SBUX",
  "ISRG",
  "C",
  "MU",
  "TGT",
  "PLD",
  "MDLZ",
  "CI",
  "MMC",
  "ETN",
  "ELV",
  "ZTS",
  "F",
  "GILD",
  "PANW",
  "T",
  "ICE",
  "MO",
  "ADP",
  "CHTR",
  "CVS",
  "BLK",
  "SO",
  "CME",
  "CL",
  "AXP",
  "KLAC",
  "CDNS",
  "EQIX",
  "PNC",
  "HCA",
  "SHW",
  "CB",
  "EOG",
  "MCO",
  "AEP",
  "REGN",
  "NSC",
  "WM",
  "MCK",
  "PH",
  "ECL",
  "ITW",
  "VRTX",
  "ORLY",
  "AIG",
  "AON",
  "DECK",
  "ROST",
  "WFC",
  "SYY",
  "TTD",
  "ILMN",
  "HSY",
  "STZ",
  "TSCO",
  "MRNA",
  "EW",
  "ADM",
  "ALL",
  "GIS",
  "BKR",
  "DHI",
  "NOC",
  "PRU",
  "MPC",
  "IDXX",
  "MET",
  "TRV",
  "AFL",
  "PSA",
  "FIS",
  "AEE",
  "FISV",
  "MRVL",
  "LULU",
  "ALGN",
  "CRWD",
  "TEAM",
  "DAL",
  "UAL",
  "NKE",
  "RIVN",
  "LCID",
  "GM",
  "GMAB",
  "ENPH",
  "PYPL",
  "SHOP",
  "NET",
  "MDB",
  "SNOW",
  "DDOG",
  "OKTA",
  "ZM",
  "DOCU",
  "PLTR",
  "PATH",
  "AFRM",
  "COIN",
  "HOOD",
  "MARA",
  "RIOT",
  "BTU",
  "WBD",
  "DIS",
  "CMCSA",
  "FOX",
  "NWSA",
  "ROKU",
  "LYV",
  "MSGS",
  "LUV",
  "JBLU",
  "AAL",
  "FDX",
  "GEHC",
  "TJX",
  "DLTR",
  "DG",
  "FIVE",
  "BBWI",
  "KSS",
  "M",
  "KR",
  "BBY",
  "WSM",
  "RH",
  "WOOF",
  "LEVI",
  "BIIB",
  "INCY",
  "ARKG",
  "BMEA",
  "EXAS",
  "TTOO",
  "DNA",
  "NVAX",
  "VCYT",
  "GH",
  "TDOC",
  "CVX",
  "OXY",
  "DVN",
  "FANG",
  "HAL",
  "SLB",
  "WEC",
  "DUK",
  "XEL",
  "FE",
  "PNW",
  "CMS",
  "ED",
  "VICI",
  "O",
  "SPG",
  "AMT",
  "CCI",
  "STAG",
  "DLR",
];

export function QuantLabAvailableTickers() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTickers = AVAILABLE_TICKERS.filter((ticker) =>
    ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border border-slate-700/50">
      <div
        className="flex items-center justify-between cursor-pointer p-4 hover:bg-slate-800/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Available Tickers in QuantLab
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {AVAILABLE_TICKERS.length} stocks currently supported by the model
            </p>
          </div>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          <div className="mt-4">
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickers (e.g., AAPL, MSFT)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                />
              </div>
              {searchQuery && (
                <p className="text-xs text-slate-400 mt-2">
                  Found {filteredTickers.length} ticker
                  {filteredTickers.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {filteredTickers.length > 0 ? (
              <>
                <p className="text-xs text-slate-400 mb-3">
                  Add any of these tickers to your watchlist to receive QuantLab
                  signals:
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {filteredTickers.map((ticker) => (
                    <div
                      key={ticker}
                      className="px-2 py-1.5 text-xs font-mono font-medium text-center rounded bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-teal-500/30 hover:bg-slate-800 transition-colors"
                    >
                      {ticker}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">
                  No tickers found matching &quot;{searchQuery}&quot;
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try a different search term
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500">
                💡 <strong>Tip:</strong> Tickers not in your watchlist
                won&apos;t appear in QuantLab signals. Add them to your
                watchlist from the dashboard to get predictions.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
