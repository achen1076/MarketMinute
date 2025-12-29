"use client";

import { useState, useEffect } from "react";
import Card from "@/components/atoms/Card";
import { ChevronDown, ChevronUp, Info, Search } from "lucide-react";
import type { ModelQuality } from "@/types/quant";

// Tickers from quant/lambda/tickers.py
const AVAILABLE_TICKERS = [
  "NVDA",
  "AAPL",
  "GOOGL",
  "MSFT",
  "AMZN",
  "META",
  "TSLA",
  "AVGO",
  "LLY",
  "JPM",
  "WMT",
  "V",
  "ORCL",
  "MA",
  "XOM",
  "JNJ",
  "PLTR",
  "NFLX",
  "BAC",
  "ABBV",
  "COST",
  "AMD",
  "HD",
  "PG",
  "GE",
  "MU",
  "CSCO",
  "CVX",
  "UNH",
  "KO",
  "WFC",
  "MS",
  "IBM",
  "CAT",
  "CRM",
  "ADBE",
  "ACN",
  "PM",
  "QCOM",
  "LIN",
  "TXN",
  "VZ",
  "RTX",
  "AMGN",
  "DIS",
  "T",
  "INTC",
  "ISRG",
  "NEE",
  "LOW",
  "PFE",
  "HON",
  "AXP",
  "BKNG",
  "SPGI",
  "UNP",
  "SYK",
  "GS",
  "A",
  "AAL",
  "AAP",
  "ABNB",
  "ABT",
  "ACGL",
  "ADI",
  "ADM",
  "ADSK",
  "AEE",
  "AEP",
  "AES",
  "AFL",
  "AFRM",
  "AG",
  "AGNC",
  "AIG",
  "AIZ",
  "AJG",
  "AKAM",
  "ALB",
  "ALGN",
  "ALL",
  "ALLE",
  "AMAT",
  "AMCR",
  "AME",
  "AMR",
  "AMT",
  "ANET",
  "ANSS",
  "AON",
  "AOS",
  "APA",
  "APD",
  "APH",
  "APO",
  "ARE",
  "ARKG",
  "ATO",
  "AVY",
  "AWK",
  "AXON",
  "AZO",
  "BA",
  "BALL",
  "BAX",
  "BBWI",
  "BBY",
  "BDX",
  "BEN",
  "BF.B",
  "BIIB",
  "BIO",
  "BITF",
  "BK",
  "BKR",
  "BLK",
  "BMY",
  "BSX",
  "BTU",
  "BXP",
  "C",
  "CAG",
  "CAH",
  "CARR",
  "CB",
  "CBOE",
  "CBRE",
  "CCI",
  "CCL",
  "CDNS",
  "CDW",
  "CE",
  "CEG",
  "CF",
  "CFG",
  "CHD",
  "CHKP",
  "CHTR",
  "CI",
  "CINF",
  "CL",
  "CLX",
  "CMA",
  "CMCSA",
  "CME",
  "CMG",
  "CMI",
  "CMS",
  "CNC",
  "CNP",
  "COF",
  "COIN",
  "COP",
  "CPB",
  "CPRT",
  "CPT",
  "CRL",
  "CRWD",
  "CSGP",
  "CSX",
  "CTAS",
  "CTRA",
  "CTSH",
  "CTVA",
  "CVS",
  "D",
  "DAL",
  "DD",
  "DDOG",
  "DE",
  "DECK",
  "DFS",
  "DG",
  "DGX",
  "DHI",
  "DHR",
  "DLR",
  "DLTR",
  "DOCU",
  "DOV",
  "DOW",
  "DPZ",
  "DRI",
  "DTE",
  "DUK",
  "DVA",
  "DVN",
  "DXCM",
  "EA",
  "EBAY",
  "ECL",
  "ED",
  "EFX",
  "EG",
  "EIX",
  "EL",
  "ELV",
  "EMN",
  "EMR",
  "ENPH",
  "EOG",
  "EPAM",
  "EQIX",
  "EQR",
  "EQT",
  "ES",
  "ESS",
  "ETN",
  "ETR",
  "EVRG",
  "EW",
  "EXAS",
  "EXC",
  "EXPD",
  "EXPE",
  "EXR",
  "F",
  "FANG",
  "FAST",
  "FCX",
  "FDS",
  "FE",
  "FICO",
  "FIS",
  "FITB",
  "FLT",
  "FMC",
  "FOX",
  "FOXA",
  "FRT",
  "FTNT",
  "FTV",
  "GD",
  "GDDY",
  "GEHC",
  "GEN",
  "GILD",
  "GIS",
  "GL",
  "GLW",
  "GM",
  "GMAB",
  "GNRC",
  "GPC",
  "GPN",
  "GRMN",
  "GWRE",
  "HAL",
  "HAS",
  "HBAN",
  "HCA",
  "HES",
  "HIG",
  "HII",
  "HLT",
  "HOLX",
  "HOOD",
  "HPQ",
  "HRL",
  "HSIC",
  "HST",
  "HSY",
  "HUBB",
  "HUM",
  "HWM",
  "IEX",
  "IFF",
  "ILMN",
  "INCY",
  "INVH",
  "IP",
  "IPG",
  "IQV",
  "IREN",
  "IRM",
  "IT",
  "ITW",
  "IVZ",
  "J",
  "JBHT",
  "JBLU",
  "JCI",
  "JKHY",
  "JNPR",
  "K",
  "KDP",
  "KEY",
  "KHC",
  "KIM",
  "KLAC",
  "KMB",
  "KMI",
  "KMX",
  "KR",
  "KSS",
  "L",
  "LDOS",
  "LEN",
  "LH",
  "LHX",
  "LKQ",
  "LMT",
  "LNC",
  "LNT",
  "LRCX",
  "LULU",
  "LUV",
  "LVS",
  "LW",
  "LYB",
  "LYV",
  "M",
  "MAA",
  "MAR",
  "MARA",
  "MAS",
  "MCK",
  "MCO",
  "MDB",
  "MCD",
  "MDT",
  "MET",
  "MGM",
  "MHK",
  "MKC",
  "MKTX",
  "MLM",
  "MMC",
  "MMM",
  "MNST",
  "MO",
  "MOH",
  "MOS",
  "MPC",
  "MPWR",
  "MRNA",
  "MRO",
  "MSI",
  "MSTR",
  "MTB",
  "MTCH",
  "MTD",
  "NCLH",
  "NDAQ",
  "NDSN",
  "NEM",
  "NET",
  "NI",
  "NKE",
  "NOC",
  "NOW",
  "NRG",
  "NSC",
  "NTRS",
  "NUE",
  "NVAX",
  "NVCR",
  "NVR",
  "NWL",
  "NWS",
  "NWSA",
  "NXPI",
  "O",
  "ODFL",
  "OKE",
  "OKTA",
  "OMC",
  "ON",
  "ORLY",
  "OTIS",
  "OXY",
  "PANW",
  "PARA",
  "PATH",
  "PAYC",
  "PAYX",
  "PCAR",
  "PCG",
  "PEAK",
  "PEG",
  "PEP",
  "PGR",
  "PH",
  "PHM",
  "PKG",
  "PKI",
  "PLD",
  "PNC",
  "PNR",
  "PNW",
  "POOL",
  "PPG",
  "PPL",
  "PRU",
  "PSA",
  "PSX",
  "PTC",
  "PUBM",
  "PYPL",
  "QRVO",
  "RCL",
  "REG",
  "REGN",
  "RF",
  "RHI",
  "RJF",
  "RL",
  "RMD",
  "ROK",
  "ROL",
  "ROP",
  "ROST",
  "RSG",
  "RVTY",
  "SBAC",
  "SBUX",
  "SCHW",
  "SHW",
  "SHOP",
  "SJM",
  "SLB",
  "SNA",
  "SNOW",
  "SO",
  "SOFI",
  "SPG",
  "STAG",
  "STE",
  "STLD",
  "STT",
  "STX",
  "STZ",
  "SWK",
  "SWKS",
  "SYF",
  "SYY",
  "TAP",
  "TDG",
  "TDOC",
  "TDY",
  "TEAM",
  "TECH",
  "TEL",
  "TER",
  "TFC",
  "TFX",
  "TGT",
  "TJX",
  "TMO",
  "TROW",
  "TRV",
  "TRGP",
  "TSCO",
  "TSN",
  "TT",
  "TTD",
  "TTWO",
  "TXT",
  "TYL",
  "UAL",
  "UPS",
  "UDR",
  "UHS",
  "ULTA",
  "URI",
  "USB",
  "VCYT",
  "VFC",
  "VICI",
  "VLO",
  "VMC",
  "VNO",
  "VRSK",
  "VRSN",
  "VRTX",
  "VTR",
  "VTRS",
  "WAB",
  "WAT",
  "WM",
  "WBD",
  "WDC",
  "WEC",
  "WELL",
  "WHR",
  "WMB",
  "WRB",
  "WST",
  "WTW",
  "WY",
  "WYNN",
  "XEL",
  "XRAY",
  "XYL",
  "YUM",
  "ZBH",
  "ZBRA",
  "ZION",
  "ZM",
  "ZS",
  "ZTS",
  "IBIT",
  "BITX",
  "RIOT",
  "UPST",
  "DKNG",
  "LCID",
  "RIVN",
  "APP",
  "PINS",
  "SE",
  "CPNG",
  "GRAB",
  "TOST",
  "DUOL",
  "RDDT",
  "HIMS",
  "SOUN",
  "BBAI",
  "RKLB",
  "ASTS",
  "IONQ",
  "RGTI",
  "QBTS",
  "OKLO",
  "SMR",
  "VRT",
  "SMCI",
  "MNDY",
];

export function QuantLabAvailableTickers() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [qualityFilter, setQualityFilter] = useState<
    "all" | "excellent" | "good" | "marginal" | "poor"
  >("all");
  const [modelQuality, setModelQuality] = useState<
    Record<string, ModelQuality>
  >({});

  useEffect(() => {
    const fetchModelQuality = async () => {
      try {
        const response = await fetch("/api/quant/model-metadata");
        if (response.ok) {
          const data = await response.json();
          setModelQuality(data.models || {});
        }
      } catch (err) {
        console.error("Failed to fetch model quality:", err);
      }
    };
    fetchModelQuality();
  }, []);

  const getTickerQuality = (ticker: string): ModelQuality | undefined => {
    return modelQuality[ticker];
  };

  const getTickerColor = (ticker: string) => {
    const quality = getTickerQuality(ticker);
    if (!quality)
      return {
        bg: "bg-slate-800/50",
        border: "border-slate-700/50",
        text: "text-slate-300",
      };

    switch (quality.quality_tier) {
      case "excellent":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
        };
      case "good":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          text: "text-blue-400",
        };
      case "marginal":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-400",
        };
      case "poor":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          text: "text-rose-400",
        };
      default:
        return {
          bg: "bg-slate-800/50",
          border: "border-slate-700/50",
          text: "text-slate-300",
        };
    }
  };

  const filteredTickers = AVAILABLE_TICKERS.filter((ticker) => {
    const matchesSearch = ticker
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (qualityFilter === "all") return true;

    const quality = getTickerQuality(ticker);
    if (!quality) return false;
    return quality.quality_tier === qualityFilter;
  });

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
            {/* Quality Legend */}
            {Object.keys(modelQuality).length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-slate-400 font-medium">Quality:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    🏆 Best
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-400">
                    ✓ Excellent
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    Good
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-400">
                    ⚠ Losing
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    ○ No data
                  </span>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickers (e.g., AAPL, MSFT)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                />
              </div>
              {Object.keys(modelQuality).length > 0 && (
                <select
                  value={qualityFilter}
                  onChange={(e) =>
                    setQualityFilter(e.target.value as typeof qualityFilter)
                  }
                  className="px-3 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="all">All Quality</option>
                  <option value="excellent">🏆 Best</option>
                  <option value="good">✓ Excellent</option>
                  <option value="marginal">Good</option>
                  <option value="poor">⚠ Losing</option>
                </select>
              )}
            </div>
            {(searchQuery || qualityFilter !== "all") && (
              <p className="text-xs text-slate-400 mb-3">
                Found {filteredTickers.length} ticker
                {filteredTickers.length !== 1 ? "s" : ""}
              </p>
            )}

            {filteredTickers.length > 0 ? (
              <>
                <p className="text-xs text-slate-400 mb-3">
                  Add any of these tickers to your watchlist to receive QuantLab
                  signals:
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {filteredTickers.map((ticker) => {
                    const colors = getTickerColor(ticker);
                    const quality = getTickerQuality(ticker);
                    return (
                      <div
                        key={ticker}
                        className={`px-2 py-1.5 text-xs font-mono font-medium text-center rounded ${colors.bg} ${colors.text} border ${colors.border} hover:opacity-80 transition-colors relative group`}
                        title={
                          quality
                            ? `${quality.quality_tier} | Sharpe: ${
                                quality.sharpe_ratio
                              } | PF: ${quality.profit_factor ?? "∞"}`
                            : "No quality data"
                        }
                      >
                        {ticker}
                        {quality && (
                          <span className="absolute -top-1 -right-1 text-[8px]">
                            {quality.quality_tier === "excellent"
                              ? "🏆"
                              : quality.quality_tier === "good"
                              ? "✓"
                              : quality.quality_tier === "marginal"
                              ? ""
                              : "⚠"}
                          </span>
                        )}
                      </div>
                    );
                  })}
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
