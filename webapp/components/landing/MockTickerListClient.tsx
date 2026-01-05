"use client";

import { useState } from "react";
import Card from "@/components/atoms/Card";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { MockTickerChart } from "./MockTickerChart";

type MockSnapshot = {
  symbol: string;
  companyName: string;
  price: number;
  changePct: number;
  priceChange: number;
  extendedHoursPrice?: number;
  extendedHoursChangePct?: number;
  extendedHoursSession?: "premarket" | "afterhours";
  isFavorite: boolean;
  previousClose: number;
  open: number;
  dayLow: number;
  dayHigh: number;
  week52Low: number;
  week52High: number;
  volume: string;
  marketCap: string;
  bid: string;
  ask: string;
  explanation: string;
};

const MOCK_SNAPSHOTS: MockSnapshot[] = [
  {
    symbol: "NVDA",
    companyName: "Nvidia",
    price: 188.85,
    changePct: 1.26,
    priceChange: 2.35,
    extendedHoursPrice: 188.98,
    extendedHoursChangePct: 0.07,
    extendedHoursSession: "afterhours",
    isFavorite: true,
    previousClose: 186.5,
    open: 187.2,
    dayLow: 185.26,
    dayHigh: 192.93,
    week52Low: 86.62,
    week52High: 212.19,
    volume: "148.2M",
    marketCap: "$4.60T",
    bid: "$188.82 x 12",
    ask: "$188.88 x 8",
    explanation: `NVDA rose 1.26% today on strong AI chip demand and new product momentum.

• Blackwell Production Ramp: Nvidia confirmed mass production of its Blackwell B200 GPUs has begun, with initial shipments to Microsoft, Google, and Amazon expected this month. Each chip sells for $30,000-$40,000.

• $10B Data Center Deal: Reuters reported Nvidia signed a multi-year $10B supply agreement with Saudi Arabia's NEOM project to power their AI city infrastructure.

• Gaming Revenue Beat: Early Q4 channel checks show GeForce RTX 50-series pre-orders exceeded internal targets by 40%, suggesting gaming segment could surprise to the upside.

The stock traded on elevated volume (148M vs 120M avg), with large block trades detected near the close.`,
  },
  {
    symbol: "AAPL",
    companyName: "Apple",
    price: 271.01,
    changePct: -0.31,
    priceChange: -0.85,
    extendedHoursPrice: 270.96,
    extendedHoursChangePct: -0.02,
    extendedHoursSession: "afterhours",
    isFavorite: false,
    previousClose: 271.86,
    open: 272.05,
    dayLow: 269.02,
    dayHigh: 277.82,
    week52Low: 169.21,
    week52High: 288.62,
    volume: "37.75M",
    marketCap: "$4.00T",
    bid: "$270.96 x 1",
    ask: "$274.97 x 4",
    explanation: `AAPL declined 0.31% after weak iPhone sales data from China and supply chain concerns.

• China Sales Drop: Counterpoint Research reported iPhone 16 sales in China fell 18% YoY in December. Huawei's Mate 70 series captured 23% market share, up from 15% last year.

• Foxconn Production Cut: Bloomberg reported Foxconn reduced iPhone assembly shifts at its Zhengzhou facility by 20% due to softer-than-expected holiday orders.

• App Store Lawsuit: The DOJ filed an expanded antitrust complaint targeting App Store fees, seeking to force Apple to allow third-party payment processors—potentially impacting $25B in annual services revenue.

The stock spiked to $277.82 in early trading before selling off on the China data release at 10:30 AM.`,
  },
  {
    symbol: "CRM",
    companyName: "Salesforce",
    price: 253.62,
    changePct: -4.26,
    priceChange: -11.28,
    extendedHoursPrice: 254.24,
    extendedHoursChangePct: 0.24,
    extendedHoursSession: "afterhours",
    isFavorite: false,
    previousClose: 264.9,
    open: 263.15,
    dayLow: 251.8,
    dayHigh: 265.2,
    week52Low: 212.0,
    week52High: 318.9,
    volume: "12.8M",
    marketCap: "$243B",
    bid: "$253.58 x 5",
    ask: "$253.65 x 3",
    explanation: `CRM dropped 4.26% after a major customer loss and weakening enterprise demand signals.

• Lost AT&T Contract: AT&T announced it will migrate from Salesforce to Microsoft Dynamics 365, a $180M annual contract loss. This follows similar moves by Verizon and T-Mobile in 2024.

• Layoffs Announced: Salesforce confirmed 700 job cuts (2% of workforce) in its Sales Cloud division, citing "strategic realignment" amid slower enterprise spending.

• Agentforce Delay: The company pushed back the general availability of Agentforce to Q2 from January, citing "additional testing requirements"—the second delay for the flagship AI product.

Heavy selling pressure emerged after the AT&T news broke at 11 AM, with 3x normal volume in the final hour.`,
  },
  {
    symbol: "NOW",
    companyName: "ServiceNow",
    price: 1047.45,
    changePct: -3.75,
    priceChange: -40.78,
    extendedHoursPrice: 1048.92,
    extendedHoursChangePct: 0.14,
    extendedHoursSession: "afterhours",
    isFavorite: false,
    previousClose: 1088.23,
    open: 1082.5,
    dayLow: 1040.2,
    dayHigh: 1085.0,
    week52Low: 637.0,
    week52High: 1198.0,
    volume: "1.2M",
    marketCap: "$216B",
    bid: "$1047.20 x 2",
    ask: "$1047.80 x 1",
    explanation: `NOW fell 3.75% after losing a major government contract and facing security concerns.

• DoD Contract Loss: The Department of Defense awarded a $2.1B IT modernization contract to Microsoft instead of ServiceNow, reversing an earlier preliminary selection. ServiceNow had been the incumbent.

• Security Vulnerability: CISA issued an advisory about a critical vulnerability in ServiceNow's Now Platform affecting government deployments. Patches are expected within 72 hours.

• CFO Stock Sale: CFO Gina Mastantuono sold $12M in shares on December 30th under a 10b5-1 plan, disclosed in today's SEC filing. This follows $28M in insider sales over the past 90 days.

The stock broke below its 50-day moving average for the first time since October.`,
  },
  {
    symbol: "TSLA",
    companyName: "Tesla",
    price: 438.07,
    changePct: -2.59,
    priceChange: -11.65,
    extendedHoursPrice: 441.49,
    extendedHoursChangePct: 0.78,
    extendedHoursSession: "afterhours",
    isFavorite: false,
    previousClose: 449.72,
    open: 445.8,
    dayLow: 432.15,
    dayHigh: 448.9,
    week52Low: 138.8,
    week52High: 488.54,
    volume: "98.5M",
    marketCap: "$1.40T",
    bid: "$438.00 x 15",
    ask: "$438.12 x 10",
    explanation: `TSLA declined 2.59% after missing Q4 delivery targets and a Cybertruck recall.

• Q4 Deliveries Miss: Tesla delivered 495,570 vehicles in Q4, missing consensus of 510K by 3%. Full-year deliveries of 1.79M were flat YoY—the first year without growth since 2020.

• Cybertruck Recall: Tesla recalled 46,000 Cybertrucks due to a drive inverter issue that can cause sudden loss of propulsion. This is the sixth recall for the vehicle since launch.

• Shanghai Production Cut: Tesla's Giga Shanghai reduced Model Y production by 20% for January, citing weaker domestic demand and rising BYD competition.

The stock fell as low as $432.15 intraday before recovering slightly on reports of strong Supercharger network revenue.`,
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft",
    price: 472.94,
    changePct: -2.21,
    priceChange: -10.69,
    extendedHoursPrice: 473.15,
    extendedHoursChangePct: 0.04,
    extendedHoursSession: "afterhours",
    isFavorite: false,
    previousClose: 483.63,
    open: 481.2,
    dayLow: 470.5,
    dayHigh: 482.8,
    week52Low: 366.5,
    week52High: 498.0,
    volume: "22.1M",
    marketCap: "$3.51T",
    bid: "$472.88 x 8",
    ask: "$472.98 x 6",
    explanation: `MSFT fell 2.21% after an Azure outage and disappointing Copilot metrics.

• Azure Outage: A 4-hour Azure outage in US East region affected thousands of enterprise customers including Delta, FedEx, and several major banks. Microsoft attributed it to a "configuration change" in networking infrastructure.

• Copilot Churn: Internal documents leaked to The Information showed 40% of enterprise Copilot trial users did not convert to paid subscriptions, below the 60% target.

• Activision Write-down: Microsoft took a $450M impairment charge on Activision mobile gaming assets, citing lower-than-expected Candy Crush revenue in Asia.

The stock tested its 200-day moving average at $470.50 before finding support.`,
  },
];

export function MockTickerListClient() {
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<string | null>(null);

  // Sort with NVDA (favorite) at top
  const sortedSnapshots = [...MOCK_SNAPSHOTS].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  const handleExplainToggle = (symbol: string) => {
    if (showExplanation === symbol) {
      setShowExplanation(null);
    } else {
      setShowExplanation(symbol);
      setExpandedSymbol(null);
    }
  };

  const handleExpandToggle = (symbol: string) => {
    if (expandedSymbol === symbol) {
      setExpandedSymbol(null);
    } else {
      setExpandedSymbol(symbol);
      setShowExplanation(null);
    }
  };

  return (
    <Card className="p-4 text-sm h-full overflow-hidden flex flex-col">
      <div className="mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground/80">
          Your Symbols
        </h3>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
        {sortedSnapshots.map((s) => (
          <div
            key={s.symbol}
            className={`flex flex-col rounded-lg px-3 py-3 transition-all relative overflow-hidden ${
              s.isFavorite
                ? "bg-amber-500/10 border border-amber-500/20"
                : "bg-muted/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="shrink-0 p-1">
                  <Star
                    size={16}
                    className={`transition-colors ${
                      s.isFavorite
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="font-medium text-foreground">
                      {s.symbol}
                      {s.isFavorite && (
                        <span className="ml-2 text-xs text-amber-400">★</span>
                      )}
                    </div>
                    {s.extendedHoursSession && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-medium">
                        {s.extendedHoursSession === "premarket"
                          ? "Pre-market"
                          : "After-hours"}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground -mt-0.5 mb-1">
                    {s.companyName}
                  </div>
                  <div className="text-md text-foreground/90">
                    ${s.price.toFixed(2)}
                  </div>
                  {s.extendedHoursSession &&
                    s.extendedHoursPrice !== undefined && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-xs text-violet-400">
                          {s.extendedHoursSession === "premarket"
                            ? "Pre-market"
                            : "After-hours"}
                          : ${s.extendedHoursPrice.toFixed(2)}
                        </span>
                        {s.extendedHoursChangePct !== undefined && (
                          <span
                            className={`text-xs font-medium ${
                              s.extendedHoursChangePct >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {s.extendedHoursChangePct >= 0 ? "+" : ""}
                            {s.extendedHoursChangePct.toFixed(2)}%
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          Jan 2, 7:59 PM
                        </span>
                      </div>
                    )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`text-sm font-semibold ${
                    s.changePct > 0
                      ? "text-emerald-400"
                      : s.changePct < 0
                      ? "text-rose-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.changePct > 0 ? "+" : ""}
                  {s.changePct.toFixed(2)}%
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  at close
                </div>
              </div>
            </div>

            {/* Interactive buttons for all tickers */}
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => handleExplainToggle(s.symbol)}
                className="text-xs text-muted-foreground/70 hover:text-foreground hover:underline transition-colors cursor-pointer"
              >
                {showExplanation === s.symbol ? "Close" : "↳ Why this moved"}
              </button>
              <button
                onClick={() => handleExpandToggle(s.symbol)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
              >
                {expandedSymbol === s.symbol ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {/* Mock Explanation */}
            {showExplanation === s.symbol && (
              <div className="mt-3 rounded bg-muted/50 p-3 text-sm leading-relaxed text-foreground/80">
                <div className="whitespace-pre-wrap">{s.explanation}</div>
                <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
                  Generated 2 minutes ago
                </div>
              </div>
            )}

            {/* Expanded Details with Chart */}
            {expandedSymbol === s.symbol && (
              <div className="mt-3 space-y-4">
                {/* Chart */}
                <MockTickerChart
                  symbol={s.symbol}
                  currentPrice={s.price}
                  priceChange={s.priceChange}
                  changePct={s.changePct}
                  previousClose={s.previousClose}
                />

                {/* After-hours Quote */}
                {s.extendedHoursSession && (
                  <div className="pt-3 border-t border-border">
                    <h4 className="text-xs font-semibold text-violet-400 mb-2">
                      After-hours Quote
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-muted-foreground">Bid</div>
                        <div className="text-violet-400 font-medium">
                          {s.bid}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Ask</div>
                        <div className="text-violet-400 font-medium">
                          {s.ask}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Data */}
                <div className="pt-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Market Cap</div>
                      <div className="text-foreground font-medium">
                        {s.marketCap}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Volume</div>
                      <div className="text-foreground font-medium">
                        {s.volume}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Open</div>
                      <div className="text-foreground font-medium">
                        ${s.open.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Prev Close</div>
                      <div className="text-foreground font-medium">
                        ${s.previousClose.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Day Low</div>
                      <div className="text-foreground font-medium">
                        ${s.dayLow.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Day High</div>
                      <div className="text-foreground font-medium">
                        ${s.dayHigh.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">52W High</div>
                      <div className="text-foreground font-medium">
                        ${s.week52High.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">52W Low</div>
                      <div className="text-foreground font-medium">
                        ${s.week52Low.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
