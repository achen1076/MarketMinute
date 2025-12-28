import { NextRequest } from "next/server";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:3100";
const IS_LAMBDA = AGENT_URL.includes("lambda-url");

export async function POST(req: NextRequest) {
  try {
    const { prompt, userId, conversationId, history } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lambda returns JSON, localhost returns SSE stream
    const endpoint = IS_LAMBDA ? AGENT_URL : `${AGENT_URL}/chat/stream`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, userId, conversationId, history }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lambda returns JSON - convert to SSE format for frontend compatibility
    if (IS_LAMBDA) {
      const data = await response.json();
      const sseResponse = `data: ${JSON.stringify({
        response: data.response,
      })}\n\ndata: [DONE]\n\n`;
      return new Response(sseResponse, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Forward the SSE stream from localhost
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Stream failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
