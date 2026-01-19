import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

/**
 * Manages the lifecycle of the MCP Server process.
 * Scalable: Can be extended to manage multiple server subprocesses.
 */
export class McpClientManager {
  private client: Client | null = null;

  async connect() {
    // Spawn MCP server using tsx (TypeScript execution)
    const serverPath = path.join(__dirname, "../../../mcp/src/server.ts");
    const mcpDir = path.join(__dirname, "../../../mcp");

    const transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", serverPath],
      cwd: mcpDir,
      env: Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined)
      ) as Record<string, string>,
    });

    this.client = new Client(
      { name: "Mintalyze-Orchestrator", version: "1.0.0" },
      { capabilities: {} }
    );

    await this.client.connect(transport);
    console.error("[agent] Connected to MCP server subprocess");
  }

  async getTools() {
    if (!this.client) throw new Error("Client not connected");
    const response = await this.client.listTools();
    return response.tools;
  }

  async callTool(name: string, args: any) {
    if (!this.client) throw new Error("Client not connected");
    return await this.client.callTool({ name, arguments: args });
  }
}
