import "dotenv/config";
import http from "http";
import { McpClientManager } from "./mcp/client";
import { MarketOrchestrator } from "./orchestrator";

const PORT = process.env.AGENT_PORT || 3100;

let orchestrator: MarketOrchestrator | null = null;

async function initialize() {
  const mcpManager = new McpClientManager();
  await mcpManager.connect();
  orchestrator = new MarketOrchestrator(mcpManager);
  console.log("[agent] Orchestrator initialized with MCP connection");
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/chat/stream") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { prompt, userId, conversationId } = JSON.parse(body);

        if (!prompt) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing prompt" }));
          return;
        }

        if (!orchestrator) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Orchestrator not ready" }));
          return;
        }

        const convId = conversationId || userId || "default";
        console.log(
          `[agent] Streaming: "${prompt.substring(0, 50)}..." (conv: ${convId})`
        );

        // Set SSE headers
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        const response = await orchestrator.run(
          prompt,
          convId,
          userId,
          (status) => {
            res.write(`data: ${JSON.stringify({ status })}\n\n`);
          }
        );

        // Send full response - client handles typing animation
        res.write(`data: ${JSON.stringify({ response })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      } catch (err: any) {
        console.error("[agent] Stream error:", err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { prompt, userId, conversationId } = JSON.parse(body);

        if (!prompt) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing prompt" }));
          return;
        }

        if (!orchestrator) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Orchestrator not ready" }));
          return;
        }

        // Use conversationId or default to oderId for history tracking
        const convId = conversationId || userId || "default";

        console.log(
          `[agent] Processing: "${prompt.substring(
            0,
            50
          )}..." (conv: ${convId})`
        );
        const response = await orchestrator.run(prompt, convId, userId);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, response, conversationId: convId }));
      } catch (err: any) {
        console.error("[agent] Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/clear") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { conversationId } = JSON.parse(body);
        if (orchestrator && conversationId) {
          orchestrator.clearHistory(conversationId);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", ready: !!orchestrator }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

async function main() {
  await initialize();
  server.listen(PORT, () => {
    console.log(`[agent] HTTP server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[agent] Fatal:", err);
  process.exit(1);
});
