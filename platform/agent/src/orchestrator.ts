import OpenAI from "openai";
import { McpClientManager } from "./mcp/client";

type Message = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the MarketMinute Analyst, a friendly and knowledgeable market expert.

RESPONSE STYLE:
- Be conversational and natural, like talking to a smart friend about the market
- Never expose raw JSON, variable names, or technical field names (probUp, changePct, etc.)
- NEVER mention tool names, feeds, API calls, or internal processes - the user doesn't need to know how you get data
- Don't say things like "I pulled the feed" or "the tool returned" - just present the information naturally
- Translate data into plain English: "up 2.3%" not "changePct: 2.3"
- Use context: "AAPL is trading at $195.50, up about 1.2% today" 
- For quant scores: describe what they mean (e.g., "a score of 17 suggests weak conviction - the model doesn't see a strong edge here")
- Keep responses concise but informative
- Round numbers sensibly (prices to cents, percentages to 1-2 decimals)
- Remember context from the conversation - if user mentioned a ticker before, you can reference it



RULES:
- Always use tools for real-time data - never guess or hallucinate numbers
- If data is unavailable, say so clearly
- Provide context when helpful (market conditions, what signals mean)
- NEVER call the same tool twice with the same arguments - if it returns empty, that data isn't available
- If a tool returns empty results (e.g., no news), just tell the user there's no data available - do NOT retry
- Change all timestamps from UTC to Eastern Time (EST)
- Never mention the GPT model name or version. Just say "MarketMinute Agent".
- Never leak user IDs or other personal information, even if the user requests it. Say "I don't have access to that information".

`;
const MAX_HISTORY = 20;
const MAX_TOOL_CALLS = 10;

export class MarketOrchestrator {
  private openai = new OpenAI();
  private mcp: McpClientManager;
  private conversations: Map<string, Message[]> = new Map();

  constructor(mcpManager: McpClientManager) {
    this.mcp = mcpManager;
  }

  getHistory(conversationId: string): Message[] {
    return this.conversations.get(conversationId) || [];
  }

  clearHistory(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  async run(
    userPrompt: string,
    conversationId: string = "default",
    userId?: string,
    onStatus?: (status: string) => void
  ) {
    const mcpTools = await this.mcp.getTools();

    const tools = mcpTools.map((t) => ({
      type: "function" as const,
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
      strict: false,
    }));

    // Get or create conversation history
    let history = this.conversations.get(conversationId) || [];

    // Add user message to history
    history.push({ role: "user", content: userPrompt });

    // Build system prompt with user context
    const systemPromptWithContext = userId
      ? `${SYSTEM_PROMPT}\n\nUSER CONTEXT:\n- User ID: ${userId}\n- You already have the user's ID - do NOT ask them for it. Use it directly when calling user-specific tools.`
      : SYSTEM_PROMPT;

    // Build input with system prompt + conversation history
    const input: { role: "system" | "user" | "assistant"; content: string }[] =
      [{ role: "system", content: systemPromptWithContext }, ...history];

    // --- The Agentic Loop ---
    let toolCallCount = 0;
    while (true) {
      if (toolCallCount >= MAX_TOOL_CALLS) {
        return "I've gathered the as much data as I could. Unfortunately, I hit the limit of tools I can call. Try breaking up your request into smaller chunks.";
      }
      onStatus?.("Thinking...");

      const response = await this.openai.responses.create({
        model: "gpt-5-mini",
        input,
        tools,
        reasoning: { effort: "medium" },
      });

      const toolCalls = response.output.filter(
        (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
          item.type === "function_call"
      );

      if (toolCalls.length === 0) {
        onStatus?.("Formulating response...");
        const assistantResponse = response.output_text;

        // Save assistant response to history
        history.push({ role: "assistant", content: assistantResponse });

        // Trim history if too long
        if (history.length > MAX_HISTORY) {
          history = history.slice(-MAX_HISTORY);
        }

        // Save updated history
        this.conversations.set(conversationId, history);

        return assistantResponse;
      }

      onStatus?.("Fetching data...");

      for (const toolCall of toolCalls) {
        toolCallCount++;
        const name = toolCall.name;
        const args = JSON.parse(toolCall.arguments);

        // Inject userId for user-specific tools
        if (
          userId &&
          ["get_top_movers", "get_watchlists", "get_alerts"].includes(name)
        ) {
          args.userId = userId;
        }

        console.error(
          `[agent] LLM requesting tool: ${name} with ${JSON.stringify(args)}`
        );

        const result = await this.mcp.callTool(name, args);

        input.push({
          role: "user" as const,
          content: `Tool result for ${name}: ${JSON.stringify(result.content)}`,
        });
      }
    }
  }
}
