import {
  ExplainTickerInputSchema,
  ExplainTickerOutputSchema,
  ExplainTickerToolSpec,
  type ExplainTickerInput,
  type ExplainTickerOutput,
} from "@/shared/schemas/tools/explainTicker.schema";

import { nowIso } from "../../ops/time";

interface ExplainApiResponse {
  explanation: string;
  cached: boolean;
  age: string | null;
  refreshing: boolean;
}

async function callExplainApi(
  ticker: string,
  changePct: number = 0,
  price?: number
): Promise<ExplainApiResponse | null> {
  const apiUrl = process.env.WEBAPP_URL || "https://market-minute.vercel.app";

  try {
    const response = await fetch(`${apiUrl}/api/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: ticker,
        changePct,
        price,
      }),
    });

    if (!response.ok) {
      console.error(`[getExplanation] API error: ${response.status}`);
      return null;
    }

    return (await response.json()) as ExplainApiResponse;
  } catch (error) {
    console.error("[getExplanation] Failed to call explain API:", error);
    return null;
  }
}

export async function handleGetExplanation(
  rawInput: unknown
): Promise<ExplainTickerOutput> {
  const input: ExplainTickerInput = ExplainTickerInputSchema.parse(rawInput);
  const ticker = input.ticker.toUpperCase();
  const context = input.context || "general";

  // Call the webapp explain API which uses GPT to analyze news
  const explainResult = await callExplainApi(ticker);

  let explanation: string;
  const sources: string[] = [];

  if (explainResult && explainResult.explanation) {
    explanation = explainResult.explanation;
    sources.push("MarketMinute AI Analysis");
    if (explainResult.cached) {
      sources.push(`Cached (${explainResult.age})`);
    }
  } else {
    explanation = `Unable to generate explanation for ${ticker} at this time. The explain API may be unavailable or there may be no recent news for this ticker.`;
  }

  const output: ExplainTickerOutput = {
    ticker,
    explanation,
    context,
    sources: sources.length > 0 ? sources : undefined,
    asOf: nowIso(),
  };

  ExplainTickerOutputSchema.parse(output);
  return output;
}

export const getExplanationTool = {
  ...ExplainTickerToolSpec,
  handler: handleGetExplanation,
} as const;
