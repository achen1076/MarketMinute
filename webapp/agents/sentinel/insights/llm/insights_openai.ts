/*
  OpenAI integration for Insights Agent
  Runs the LLM separately from the main Sentinel report
*/

import { OpenAI } from "openai";
import { SENTINEL_ENV } from "../../config/env";

const client = new OpenAI({ apiKey: SENTINEL_ENV.OPENAI_API_KEY });

export async function runInsightsLLM(prompt: string) {
  const completion = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
    text: { verbosity: "medium" },
  });

  return completion.output_text?.trim() || "";
}
