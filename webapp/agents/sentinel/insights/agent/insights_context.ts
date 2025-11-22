/*
  Context definition for the Insights Agent
  Receives Sentinel report data and market context to generate insight cards
*/

export interface InsightsContext {
  sentinelReport: any;
  marketSnapshot: any;
  macroEvents?: any;
}

export interface InsightCard {
  title: string;
  category:
    | "market"
    | "sector"
    | "volatility"
    | "macro"
    | "opportunity"
    | "risk";
  insight: string;
  dataPoints: string[];
  confidence: "high" | "medium" | "low";
}

export interface InsightsOutput {
  cards: InsightCard[];
  timestamp: string;
}
