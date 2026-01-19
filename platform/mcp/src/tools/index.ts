import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Market tools
import { getQuoteSnapshotTool } from "./market/getQuoteSnapshot";
import { getTopMoversTool } from "./market/getTopMovers";
import { getMarketSummaryTool } from "./market/getMarketSummary";

// User tools
import { getWatchlistsTool } from "./user/getWatchlists";
import { getAlertsTool } from "./user/getAlerts";
import { createWatchlistTool } from "./user/createWatchlist";
import { editWatchlistTool } from "./user/editWatchlist";

// QuantLab tools
import { getQuantSignalsTool } from "./quantlab/getQuantSignals";
import { getModelQualityTool } from "./quantlab/getModelQuality";
import { getTopSignalsTool } from "./quantlab/getTopSignals";

// Sentinel tools
import { getSentinelReportTool } from "./sentinel/getSentinelReport";
import { getInsightsTool } from "./sentinel/getInsights";

// News tools
import { getTickerNewsTool } from "./news/getTickerNews";
import { getTickerEventsTool } from "./news/getTickerEvents";
import { getMacroEventsTool } from "./news/getMacroEvents";

// Analysis tools
import { getSentimentTool } from "./analysis/getSentiment";
import { getTickerAlertsTool } from "./analysis/getTickerAlerts";
import { getExplanationTool } from "./analysis/getExplanation";

// Info tools
import { aboutMintalyzeTool } from "./info/aboutMarketMinute";

/**
 * Automatically registers all tools with the MCP server instance.
 * As your app grows, you only add new tools to the array below.
 */
export function registerAllTools(server: McpServer) {
  const tools = [
    // Market
    getQuoteSnapshotTool,
    getTopMoversTool,
    getMarketSummaryTool,
    // User
    getWatchlistsTool,
    getAlertsTool,
    createWatchlistTool,
    editWatchlistTool,
    // QuantLab
    getQuantSignalsTool,
    getModelQualityTool,
    getTopSignalsTool,
    // Sentinel
    getSentinelReportTool,
    getInsightsTool,
    // News
    getTickerNewsTool,
    getTickerEventsTool,
    getMacroEventsTool,
    // Analysis
    getSentimentTool,
    getTickerAlertsTool,
    getExplanationTool,
    // Info
    aboutMintalyzeTool,
  ];

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema.shape,
      },
      async (args: any) => {
        try {
          process.stderr.write(
            `[mcp] Executing ${tool.name} with ${JSON.stringify(args)}\n`
          );
          const result = await tool.handler(args);
          process.stderr.write(`[mcp] ${tool.name} success\n`);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result) }],
          };
        } catch (error: any) {
          process.stderr.write(
            `[mcp] ${tool.name} ERROR: ${error.message}\n${error.stack}\n`
          );
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: `Error in ${tool.name}: ${error.message}`,
              },
            ],
          };
        }
      }
    );
  }
}
