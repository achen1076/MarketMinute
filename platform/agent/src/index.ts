import { McpClientManager } from "./mcp/client";
import { MarketOrchestrator } from "./orchestrator";

async function main() {
  const mcpManager = new McpClientManager();
  await mcpManager.connect();

  const orchestrator = new MarketOrchestrator(mcpManager);

  // Example Test Query
  const answer = await orchestrator.run(
    "What is the current price of AAPL and NVDA? Compare them."
  );
  console.log("\n--- FINAL RESPONSE ---\n");
  console.log(answer);
}

main().catch(console.error);
