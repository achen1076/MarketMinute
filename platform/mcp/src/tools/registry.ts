import { getQuoteSnapshotTool } from "./market/getQuoteSnapshot";
import { getTopMoversTool } from "./market/getTopMovers";
import { getMarketSummaryTool } from "./market/getMarketSummary";
import { getWatchlistsTool } from "./user/getWatchlists";
import { getAlertsTool } from "./user/getAlerts";
import { getQuantSignalsTool } from "./quantlab/getQuantSignals";
import { getSentinelReportTool } from "./sentinel/getSentinelReport";
import { getInsightsTool } from "./sentinel/getInsights";
import { getTickerNewsTool } from "./news/getTickerNews";
import { getTickerEventsTool } from "./news/getTickerEvents";
import { getMacroEventsTool } from "./news/getMacroEvents";
import { getSentimentTool } from "./analysis/getSentiment";
import { getTickerAlertsTool } from "./analysis/getTickerAlerts";

export const toolRegistry = {
  get_quote_snapshot: getQuoteSnapshotTool,
  get_top_movers: getTopMoversTool,
  get_market_summary: getMarketSummaryTool,
  get_watchlists: getWatchlistsTool,
  get_alerts: getAlertsTool,
  get_quant_signals: getQuantSignalsTool,
  get_sentinel_report: getSentinelReportTool,
  get_insights: getInsightsTool,
  get_ticker_news: getTickerNewsTool,
  get_ticker_events: getTickerEventsTool,
  get_macro_events: getMacroEventsTool,
  get_sentiment: getSentimentTool,
  get_ticker_alerts: getTickerAlertsTool,
} as const;

export type ToolName = keyof typeof toolRegistry;

export async function executeMcpTool(name: string, args: any): Promise<any> {
  const tool = toolRegistry[name as ToolName];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return await tool.handler(args);
}

export function getToolDefinitions() {
  return Object.values(toolRegistry).map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object" as const,
        properties: tool.inputSchema.shape,
      },
    },
  }));
}

export { toolRegistry as tools };
