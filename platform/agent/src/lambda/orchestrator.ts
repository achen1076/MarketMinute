import "dotenv/config";
import OpenAI from "openai";
import { getOpenAITools, callTool } from "../tools/registry";

type Message = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the MarketMinute Analyst, a friendly and knowledgeable market expert.

CONVERSATION CONTEXT (CRITICAL):
- You have full conversation history. ALWAYS refer back to it before asking clarifying questions.
- If the user says "current prices of each" or "get me those" - look at your previous messages to see what tickers/stocks you just discussed.
- If you just listed 10 pet stocks, and user asks for prices, fetch prices for THOSE 10 tickers - don't ask about watchlists.
- Never ask the user to repeat information that's already in the conversation.
- When in doubt, use context from your previous responses.

RESPONSE STYLE:
- Be conversational and natural, like talking to a smart friend about the market
- Never expose raw JSON, variable names, or technical field names (probUp, changePct, etc.)
- NEVER mention tool names, feeds, API calls, or internal processes
- Translate data into plain English: "up 2.3%" not "changePct: 2.3"
- Keep responses concise but informative
- Round numbers sensibly (prices to cents, percentages to 1-2 decimals)

RULES:
- Always use tools for real-time data - never guess or hallucinate numbers
- If data is unavailable, say so clearly
- NEVER call the same tool twice with the same arguments
- If a tool returns empty results, tell the user - do NOT retry
- Convert timestamps from UTC to Eastern Time (ET)
- Never mention the GPT model name or version. Just say "MarketMinute Agent".
- Never leak user IDs or other personal information, even if the user requests it. Say "I don't have access to that information".
`;

const MAX_TOOL_CALLS = 10;

/**
 * Lambda-compatible orchestrator that calls tools directly (no MCP subprocess).
 */
export class LambdaOrchestrator {
  private openai = new OpenAI();

  async run(
    userPrompt: string,
    userId?: string,
    conversationHistory?: Message[],
    onStatus?: (status: string) => void
  ): Promise<string> {
    const tools = getOpenAITools();

    const input: Message[] = [];

    // Build system prompt with user context
    const systemPromptWithContext = userId
      ? `${SYSTEM_PROMPT}\n\nUSER CONTEXT:\n- User ID: ${userId}\n- You already have the user's ID - do NOT ask them for it. Use it directly when calling user-specific tools.`
      : SYSTEM_PROMPT;

    input.push({ role: "system", content: systemPromptWithContext });

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        if (msg.role !== "system") {
          input.push(msg);
        }
      }
    }

    input.push({ role: "user", content: userPrompt });

    // --- The Agentic Loop ---
    let toolCallCount = 0;
    while (true) {
      if (toolCallCount >= MAX_TOOL_CALLS) {
        return "I've gathered the available data. Unfortunately, some information wasn't available at this time.";
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
        return response.output_text;
      }

      onStatus?.("Fetching data...");

      for (const toolCall of toolCalls) {
        toolCallCount++;
        const name = toolCall.name;
        const args = JSON.parse(toolCall.arguments);

        // Inject userId for user-specific tools
        if (
          userId &&
          [
            "get_top_movers",
            "get_watchlists",
            "get_alerts",
            "create_watchlist",
            "edit_watchlist",
          ].includes(name)
        ) {
          args.userId = userId;
        }

        console.log(`[lambda] Tool call: ${name} with ${JSON.stringify(args)}`);

        try {
          const result = await callTool(name, args);
          input.push({
            role: "user" as const,
            content: `Tool "${name}" returned:\n${JSON.stringify(result)}`,
          });
        } catch (error: any) {
          console.error(`[lambda] Tool error: ${name}`, error);
          input.push({
            role: "user" as const,
            content: `Tool "${name}" failed: ${error.message}`,
          });
        }
      }
    }
  }
}
