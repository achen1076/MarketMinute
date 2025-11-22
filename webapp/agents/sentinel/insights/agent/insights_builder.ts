/*
  Insights prompt builder
  Loads the prompt template and injects context data
*/

import fs from "fs";
import path from "path";
import { InsightsContext } from "./insights_context";

export async function buildInsightsPrompt(context: InsightsContext) {
  const template = fs.readFileSync(
    path.join(
      process.cwd(),
      "agents/sentinel/insights/prompts/insights_prompt.md"
    ),
    "utf-8"
  );

  const ctx = JSON.stringify(context, null, 2);

  return `${template}

CONTEXT:
${ctx}
`;
}
