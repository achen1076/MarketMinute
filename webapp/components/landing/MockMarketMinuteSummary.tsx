"use client";

import Card from "@/components/atoms/Card";

const MOCK_SUMMARY = {
  headline: "Market Summary",
  stats: {
    totalSymbols: 6,
    upCount: 1,
    downCount: 5,
    best: { symbol: "NVDA", changePct: 1.26 },
  },
  body: [
    {
      text: "Nvidia",
      color: "emerald",
    },
    {
      text: " rose 1.26% to $188.85, the sole gainer in today's session, after confirming Blackwell B200 mass production has begun with shipments to major cloud providers this month. Reuters also reported a $10B supply deal with Saudi Arabia's NEOM project. ",
      color: null,
    },
    {
      text: "Apple",
      color: "rose",
    },
    {
      text: " edged down 0.31% to $271.01 on weak China data—iPhone 16 sales fell 18% YoY as Huawei's Mate 70 captured 23% market share. The DOJ also filed an expanded App Store antitrust complaint.",
      color: null,
    },
  ],
  body2: [
    {
      text: "Enterprise software faced broad selling pressure on customer losses. ",
      color: null,
    },
    {
      text: "Salesforce",
      color: "rose",
    },
    {
      text: " dropped 4.26% to $253.62 after AT&T announced migration to Microsoft Dynamics 365, a $180M contract loss. The company also announced 700 layoffs and delayed Agentforce to Q2. ",
      color: null,
    },
    {
      text: "ServiceNow",
      color: "rose",
    },
    {
      text: " fell 3.75% to $1,047.45 after losing a $2.1B DoD contract to Microsoft and CISA flagging a critical security vulnerability. ",
      color: null,
    },
    {
      text: "Tesla",
      color: "rose",
    },
    {
      text: " declined 2.59% to $438.07 after Q4 deliveries missed at 495K and a recall of 46,000 Cybertrucks for drive inverter issues. ",
      color: null,
    },
    {
      text: "Microsoft",
      color: "rose",
    },
    {
      text: " lost 2.21% to $472.94 following a 4-hour Azure outage affecting major enterprises and leaked documents showing 40% Copilot trial churn.",
      color: null,
    },
  ],
  generatedAt: "Jan 2, 8:00 PM",
};

export function MockMintalyzeSummary() {
  const renderHighlightedText = (
    segments: Array<{ text: string; color: string | null }>
  ) => {
    return segments.map((segment, idx) => {
      if (segment.color === "emerald") {
        return (
          <span key={idx} className="text-emerald-400 font-semibold">
            {segment.text}
          </span>
        );
      }
      if (segment.color === "rose") {
        return (
          <span key={idx} className="text-rose-400 font-semibold">
            {segment.text}
          </span>
        );
      }
      return <span key={idx}>{segment.text}</span>;
    });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {MOCK_SUMMARY.headline}
        </h2>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Mintalyze</span>
          <span className="text-[10px] text-muted-foreground/70">
            {MOCK_SUMMARY.generatedAt}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4 md:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Total Symbols</div>
          <div className="mt-1 text-lg font-semibold text-foreground">
            {MOCK_SUMMARY.stats.totalSymbols}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Up</div>
          <div className="mt-1 text-lg font-semibold text-emerald-400">
            {MOCK_SUMMARY.stats.upCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Down</div>
          <div className="mt-1 text-lg font-semibold text-rose-400">
            {MOCK_SUMMARY.stats.downCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Best Performer</div>
          <div className="mt-1 text-sm font-semibold text-emerald-400">
            {MOCK_SUMMARY.stats.best.symbol} (+
            {MOCK_SUMMARY.stats.best.changePct.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="prose prose-invert dark:prose-invert max-w-none">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{renderHighlightedText(MOCK_SUMMARY.body)}</p>
          <p>{renderHighlightedText(MOCK_SUMMARY.body2)}</p>
        </div>
      </div>
    </Card>
  );
}
