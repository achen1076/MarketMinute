import OpenAI from "openai";

export const openai = new OpenAI();

export async function runMiniChat(opts: { system: string; user: string }) {
  const { system, user } = opts;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  const completion = await openai.responses.create({
    model: "gpt-5.2",
    input: messages,
    reasoning: { effort: "medium" },
    text: { verbosity: "low" },
  });

  return completion.output_text;
}
