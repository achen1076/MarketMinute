import { SentinelContext, SpecialReport } from "./types";
import { runLLM } from "../llm/openai";
import { SENTINEL_ENV } from "../config/env";
import fs from "fs";
import path from "path";

/*
  Loads the markdown template for the Sentinel report.
*/
async function loadPrompt(): Promise<string> {
  const promptPath = path.join(
    process.cwd(),
    "agents/sentinel/llm/prompts/sentinel_prompts.md"
  );

  return fs.readFileSync(promptPath, "utf-8");
}

/*
  Builds a full prompt for the LLM using provided context.
*/
function buildPrompt(template: string, context: SentinelContext): string {
  const json = JSON.stringify(context, null, 2);

  return `${template}

---

# CONTEXT DATA (JSON)
${json}

# INSTRUCTIONS
Return ONLY valid JSON with:
{
  "summary": "...",
  "keyDrivers": ["..."],
  "macroContext": "..."
}
`;
}

/*
  Generates a full special report using the LLM.
*/
export async function generateSpecialReport(
  context: SentinelContext
): Promise<SpecialReport> {
  const template = await loadPrompt();
  const prompt = buildPrompt(template, context);

  const text = await runLLM({
    model: "gpt-5-mini",
    prompt,
  });

  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || text,
      keyDrivers: parsed.keyDrivers || [],
      macroContext: parsed.macroContext || null,
    };
  } catch (error) {
    console.error("[Sentinel] Failed to parse LLM response as JSON:", error);
    return {
      summary: text,
      keyDrivers: [],
      macroContext: null,
    };
  }
}
