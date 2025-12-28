import "dotenv/config";
import { LambdaOrchestrator } from "./orchestrator";

interface LambdaEvent {
  body?: string;
  requestContext?: {
    http?: { method: string };
  };
  headers?: Record<string, string>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  prompt: string;
  userId?: string;
  conversationId?: string;
  history?: ChatMessage[];
}

const orchestrator = new LambdaOrchestrator();

/**
 * AWS Lambda handler for the MarketMinute Agent.
 * Supports both regular JSON responses and streaming (via Lambda response streaming).
 */
export async function handler(event: LambdaEvent) {
  const method = event.requestContext?.http?.method || "POST";

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: "",
    };
  }

  // Health check
  if (method === "GET") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        status: "healthy",
        service: "marketminute-agent",
      }),
    };
  }

  // POST - chat request
  if (method === "POST") {
    try {
      const body: ChatRequest = JSON.parse(event.body || "{}");
      const { prompt, userId, history } = body;

      if (!prompt) {
        return {
          statusCode: 400,
          headers: corsHeaders(),
          body: JSON.stringify({ error: "Missing prompt" }),
        };
      }

      console.log(
        `[lambda] Chat request: "${prompt.substring(0, 50)}..." (history: ${
          history?.length || 0
        } msgs)`
      );

      const response = await orchestrator.run(prompt, userId, history);

      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ response }),
      };
    } catch (error: any) {
      console.error("[lambda] Error:", error);
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ error: error.message || "Internal error" }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders(),
    body: JSON.stringify({ error: "Method not allowed" }),
  };
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
