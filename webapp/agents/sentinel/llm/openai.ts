import { OpenAI } from "openai";
import { SENTINEL_ENV } from "../config/env";

/*
  Creates an OpenAI client for Sentinel.
*/
export const client = new OpenAI({
  apiKey: SENTINEL_ENV.OPENAI_API_KEY,
});

/*
  Sends a prompt to OpenAI with a given model.
*/
export async function runLLM(params: {
  model: string;
  prompt: string;
}): Promise<string> {
  const completion = await client.responses.create({
    model: "gpt-5-mini",
    input: params.prompt,
    reasoning: { effort: "low" },
    text: { verbosity: "low" },
  });

  const text = completion.output_text || "";
  return text.trim();
}
