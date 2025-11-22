/*
  Main Insights Agent
  Entry point for generating insight cards from market data
*/

import { buildInsightsPrompt } from "./insights_builder";
import { runInsightsLLM } from "../llm/insights_openai";
import { InsightsContext } from "./insights_context";

export async function runInsightsAgent(context: InsightsContext) {
  const prompt = await buildInsightsPrompt(context);
  const result = await runInsightsLLM(prompt);
  return result;
}
