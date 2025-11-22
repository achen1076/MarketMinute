import fs from "fs";
import path from "path";

export async function loadPrompt(): Promise<string> {
  const promptPath = path.join(
    process.cwd(),
    "sentinel/llm/prompts/sentinel_report.md"
  );
  return fs.readFileSync(promptPath, "utf-8");
}
