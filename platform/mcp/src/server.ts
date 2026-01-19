// platform/mcp/src/server.ts
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools";

async function main() {
  const server = new McpServer({
    name: "Mintalyze-Platform",
    version: "1.0.0",
  });

  // Plug in all tools from the registry
  registerAllTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write("[mcp] Mintalyze Platform running (stdio)\n");
}

main().catch((err) => {
  process.stderr.write(`[mcp] fatal: ${err?.stack ?? String(err)}\n`);
  process.exit(1);
});
