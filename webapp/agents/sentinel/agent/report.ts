import { SentinelContext, SpecialReport, WhatThisMeans } from "./types";
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

  // Pre-format percentages so LLM can't hallucinate them
  const indexSummary = context.market.indices
    .map((i) => `${i.symbol}: ${i.changePct.toFixed(2)}%`)
    .join(", ");
  const sectorSummary = context.market.sectors
    .map((s) => `${s.symbol}: ${s.changePct.toFixed(2)}%`)
    .join(", ");

  return `${template}

---

# EXACT PERCENTAGE VALUES (USE THESE EXACTLY)
**Indices:** ${indexSummary}
**Sectors:** ${sectorSummary}

# CONTEXT DATA (JSON)
${json}

# INSTRUCTIONS
Return ONLY valid JSON with:
{
  "summary": "...",
  "keyDrivers": ["..."],
  "macroContext": "..."
}

REMINDER: Use ONLY the exact percentages shown above. Do NOT invent different values.
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

/*
  Generates "What This Means" structured narrative from the report context.
*/
export async function generateWhatThisMeans(
  context: SentinelContext,
  report: SpecialReport
): Promise<WhatThisMeans> {
  const prompt = `You are a market analyst explaining today's market action to an informed investor.

      # Context
      ${JSON.stringify(context, null, 2)}

      # Today's Summary
      ${report.summary}

      # Key Drivers
      ${report.keyDrivers.join(", ")}

      # Your Task
      Generate a structured narrative that helps the user understand what happened and what it means.

      ## Tone & Style
      - Conversational, calm, human tone
      - No jargon, no predictions, no idioms
      - No investment advice
      - Something between Morning Brew + Goldman Sachs notes

      Return ONLY valid JSON with this structure:
      {
        "whatHappened": "2-3 sentence summary in plain English of what happened today",
        "whyItMatters": "2-3 sentences explaining the significance - why should they care?",
        "whatCouldHappenNext": "2-3 sentences on potential scenarios (not predictions)",
        "whatToWatch": ["3-5 specific things to watch tomorrow as array of strings"]
      }
    `;

  const text = await runLLM({
    model: "gpt-5-mini",
    prompt,
  });

  try {
    const parsed = JSON.parse(text);
    return {
      whatHappened: parsed.whatHappened || report.summary,
      whyItMatters:
        parsed.whyItMatters || "Market activity within normal ranges.",
      whatCouldHappenNext:
        parsed.whatCouldHappenNext ||
        "Near-term path depends on upcoming data and earnings.",
      whatToWatch: parsed.whatToWatch || [
        "Market reaction to overnight futures",
        "Any changes in volatility levels",
      ],
    };
  } catch (error) {
    console.error(
      "[Sentinel] Failed to parse What This Means response:",
      error
    );
    return {
      whatHappened: report.summary,
      whyItMatters: "Market activity within normal ranges.",
      whatCouldHappenNext:
        "Near-term path depends on upcoming data and earnings.",
      whatToWatch: [
        "Market reaction to overnight futures",
        "Any changes in volatility levels",
      ],
    };
  }
}
