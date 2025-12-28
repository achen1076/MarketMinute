import { NextResponse } from "next/server";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:3100";

export async function POST(req: Request) {
  try {
    const { prompt, userId, conversationId } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt'" },
        { status: 400 }
      );
    }

    const response = await fetch(`${AGENT_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, userId, conversationId }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error("[agent-proxy] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Agent proxy error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { conversationId } = await req.json();

    const response = await fetch(`${AGENT_URL}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Clear failed" },
      { status: 500 }
    );
  }
}
