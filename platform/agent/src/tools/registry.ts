/**
 * Direct tool registry for Lambda - bypasses MCP subprocess.
 * Tools are called directly without stdio transport.
 */

// Market tools
import { handleGetQuoteSnapshot } from "../../../mcp/src/tools/market/getQuoteSnapshot";
import { handleGetTopMovers } from "../../../mcp/src/tools/market/getTopMovers";
import { handleGetMarketSummary } from "../../../mcp/src/tools/market/getMarketSummary";

// User tools
import { handleGetWatchlists } from "../../../mcp/src/tools/user/getWatchlists";
import { handleGetAlerts } from "../../../mcp/src/tools/user/getAlerts";
import { handleCreateWatchlist } from "../../../mcp/src/tools/user/createWatchlist";
import { handleEditWatchlist } from "../../../mcp/src/tools/user/editWatchlist";

// QuantLab tools
import { handleGetQuantSignals } from "../../../mcp/src/tools/quantlab/getQuantSignals";
import { handleGetModelQuality } from "../../../mcp/src/tools/quantlab/getModelQuality";
import { handleGetTopSignals } from "../../../mcp/src/tools/quantlab/getTopSignals";

// Sentinel tools
import { handleGetSentinelReport } from "../../../mcp/src/tools/sentinel/getSentinelReport";
import { handleGetInsights } from "../../../mcp/src/tools/sentinel/getInsights";

// News tools
import { handleGetTickerNews } from "../../../mcp/src/tools/news/getTickerNews";
import { handleGetTickerEvents } from "../../../mcp/src/tools/news/getTickerEvents";
import { handleGetMacroEvents } from "../../../mcp/src/tools/news/getMacroEvents";

// Analysis tools
import { handleGetSentiment } from "../../../mcp/src/tools/analysis/getSentiment";
import { handleGetTickerAlerts } from "../../../mcp/src/tools/analysis/getTickerAlerts";
import { handleGetExplanation } from "../../../mcp/src/tools/analysis/getExplanation";

// Info tools
import { handleAboutMarketMinute } from "../../../mcp/src/tools/info/aboutMarketMinute";

// Schemas for OpenAI tool definitions
import { GetQuoteSnapshotToolSpec } from "../../../shared/schemas/tools/getQuoteSnapshot.schema";
import { GetTopMoversToolSpec } from "../../../shared/schemas/tools/getTopMovers.schema";
import { GetMarketSummaryToolSpec } from "../../../shared/schemas/tools/getMarketSummary.schema";
import { GetWatchlistsToolSpec } from "../../../shared/schemas/tools/getWatchlists.schema";
import { GetAlertsToolSpec } from "../../../shared/schemas/tools/getAlerts.schema";
import { CreateWatchlistToolSpec } from "../../../shared/schemas/tools/createWatchlist.schema";
import { EditWatchlistToolSpec } from "../../../shared/schemas/tools/editWatchlist.schema";
import { GetQuantSignalsToolSpec } from "../../../shared/schemas/tools/getQuantSignals.schema";
import { GetModelQualityToolSpec } from "../../../shared/schemas/tools/getModelQuality.schema";
import { GetTopSignalsToolSpec } from "../../../shared/schemas/tools/getTopSignals.schema";
import { GetSentinelReportToolSpec } from "../../../shared/schemas/tools/getSentinelReport.schema";
import { GetInsightsToolSpec } from "../../../shared/schemas/tools/getInsights.schema";
import { GetTickerNewsToolSpec } from "../../../shared/schemas/tools/getTickerNews.schema";
import { GetTickerEventsToolSpec } from "../../../shared/schemas/tools/getTickerEvents.schema";
import { GetMacroEventsToolSpec } from "../../../shared/schemas/tools/getMacroEvents.schema";
import { GetSentimentToolSpec } from "../../../shared/schemas/tools/getSentiment.schema";
import { GetTickerAlertsToolSpec } from "../../../shared/schemas/tools/getTickerAlerts.schema";
import { ExplainTickerToolSpec } from "../../../shared/schemas/tools/explainTicker.schema";
import { AboutMarketMinuteToolSpec } from "../../../shared/schemas/tools/aboutMarketMinute.schema";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (args: any) => Promise<any>;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  // Market
  {
    name: GetQuoteSnapshotToolSpec.name,
    description: GetQuoteSnapshotToolSpec.description,
    inputSchema: GetQuoteSnapshotToolSpec.inputSchema,
    handler: handleGetQuoteSnapshot,
  },
  {
    name: GetTopMoversToolSpec.name,
    description: GetTopMoversToolSpec.description,
    inputSchema: GetTopMoversToolSpec.inputSchema,
    handler: handleGetTopMovers,
  },
  {
    name: GetMarketSummaryToolSpec.name,
    description: GetMarketSummaryToolSpec.description,
    inputSchema: GetMarketSummaryToolSpec.inputSchema,
    handler: handleGetMarketSummary,
  },
  // User
  {
    name: GetWatchlistsToolSpec.name,
    description: GetWatchlistsToolSpec.description,
    inputSchema: GetWatchlistsToolSpec.inputSchema,
    handler: handleGetWatchlists,
  },
  {
    name: GetAlertsToolSpec.name,
    description: GetAlertsToolSpec.description,
    inputSchema: GetAlertsToolSpec.inputSchema,
    handler: handleGetAlerts,
  },
  {
    name: CreateWatchlistToolSpec.name,
    description: CreateWatchlistToolSpec.description,
    inputSchema: CreateWatchlistToolSpec.inputSchema,
    handler: handleCreateWatchlist,
  },
  {
    name: EditWatchlistToolSpec.name,
    description: EditWatchlistToolSpec.description,
    inputSchema: EditWatchlistToolSpec.inputSchema,
    handler: handleEditWatchlist,
  },
  // QuantLab
  {
    name: GetQuantSignalsToolSpec.name,
    description: GetQuantSignalsToolSpec.description,
    inputSchema: GetQuantSignalsToolSpec.inputSchema,
    handler: handleGetQuantSignals,
  },
  {
    name: GetModelQualityToolSpec.name,
    description: GetModelQualityToolSpec.description,
    inputSchema: GetModelQualityToolSpec.inputSchema,
    handler: handleGetModelQuality,
  },
  {
    name: GetTopSignalsToolSpec.name,
    description: GetTopSignalsToolSpec.description,
    inputSchema: GetTopSignalsToolSpec.inputSchema,
    handler: handleGetTopSignals,
  },
  // Sentinel
  {
    name: GetSentinelReportToolSpec.name,
    description: GetSentinelReportToolSpec.description,
    inputSchema: GetSentinelReportToolSpec.inputSchema,
    handler: handleGetSentinelReport,
  },
  {
    name: GetInsightsToolSpec.name,
    description: GetInsightsToolSpec.description,
    inputSchema: GetInsightsToolSpec.inputSchema,
    handler: handleGetInsights,
  },
  // News
  {
    name: GetTickerNewsToolSpec.name,
    description: GetTickerNewsToolSpec.description,
    inputSchema: GetTickerNewsToolSpec.inputSchema,
    handler: handleGetTickerNews,
  },
  {
    name: GetTickerEventsToolSpec.name,
    description: GetTickerEventsToolSpec.description,
    inputSchema: GetTickerEventsToolSpec.inputSchema,
    handler: handleGetTickerEvents,
  },
  {
    name: GetMacroEventsToolSpec.name,
    description: GetMacroEventsToolSpec.description,
    inputSchema: GetMacroEventsToolSpec.inputSchema,
    handler: handleGetMacroEvents,
  },
  // Analysis
  {
    name: GetSentimentToolSpec.name,
    description: GetSentimentToolSpec.description,
    inputSchema: GetSentimentToolSpec.inputSchema,
    handler: handleGetSentiment,
  },
  {
    name: GetTickerAlertsToolSpec.name,
    description: GetTickerAlertsToolSpec.description,
    inputSchema: GetTickerAlertsToolSpec.inputSchema,
    handler: handleGetTickerAlerts,
  },
  {
    name: ExplainTickerToolSpec.name,
    description: ExplainTickerToolSpec.description,
    inputSchema: ExplainTickerToolSpec.inputSchema,
    handler: handleGetExplanation,
  },
  // Info
  {
    name: AboutMarketMinuteToolSpec.name,
    description: AboutMarketMinuteToolSpec.description,
    inputSchema: AboutMarketMinuteToolSpec.inputSchema,
    handler: handleAboutMarketMinute,
  },
];

/**
 * Convert Zod schema to JSON Schema format for OpenAI
 */
function zodToJsonSchema(schema: any): Record<string, any> {
  // Handle different Zod schema structures
  let shape: Record<string, any> | undefined;

  try {
    if (typeof schema._def?.shape === "function") {
      shape = schema._def.shape();
    } else if (schema._def?.shape) {
      shape = schema._def.shape;
    } else if (schema.shape) {
      shape =
        typeof schema.shape === "function" ? schema.shape() : schema.shape;
    }
  } catch {
    shape = undefined;
  }

  if (!shape) {
    return { type: "object", properties: {} };
  }

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const def = (value as any)?._def;
    let prop: any = { type: "string" };
    let isOptional = false;

    if (!def) {
      properties[key] = prop;
      continue;
    }

    const typeName = def.typeName;

    if (typeName === "ZodArray") {
      prop = { type: "array", items: { type: "string" } };
    } else if (typeName === "ZodString") {
      prop = { type: "string" };
    } else if (typeName === "ZodNumber") {
      prop = { type: "number" };
    } else if (typeName === "ZodBoolean") {
      prop = { type: "boolean" };
    } else if (typeName === "ZodOptional") {
      isOptional = true;
      const inner = def.innerType?._def?.typeName;
      if (inner === "ZodNumber") prop = { type: "number" };
      else if (inner === "ZodArray")
        prop = { type: "array", items: { type: "string" } };
      else prop = { type: "string" };
    } else if (typeName === "ZodDefault") {
      isOptional = true;
      const inner = def.innerType?._def?.typeName;
      if (inner === "ZodNumber") prop = { type: "number" };
      else if (inner === "ZodArray")
        prop = { type: "array", items: { type: "string" } };
      else prop = { type: "string" };
    }

    properties[key] = prop;
    if (!isOptional) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

/**
 * Get tool definitions formatted for OpenAI
 */
export function getOpenAITools() {
  return TOOL_REGISTRY.map((t) => ({
    type: "function" as const,
    name: t.name,
    description: t.description,
    parameters: zodToJsonSchema(t.inputSchema),
    strict: false,
  }));
}

/**
 * Call a tool by name
 */
export async function callTool(name: string, args: any): Promise<any> {
  const tool = TOOL_REGISTRY.find((t) => t.name === name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }
  console.log(`[tools] Executing ${name} with ${JSON.stringify(args)}`);
  const result = await tool.handler(args);
  console.log(`[tools] ${name} success`);
  return result;
}
