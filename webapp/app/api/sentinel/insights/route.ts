import { NextResponse } from "next/server";
import { runInsightsAgent } from "@/agents/sentinel/insights/agent/insights_agent";

export async function POST(req: Request) {
  try {
    const { context } = await req.json();

    if (!context) {
      return NextResponse.json(
        { ok: false, error: "Context is required" },
        { status: 400 }
      );
    }

    const output = await runInsightsAgent(context);

    return NextResponse.json({
      ok: true,
      insights: JSON.parse(output),
    });
  } catch (e) {
    console.error("[Insights Error]", e);
    return NextResponse.json(
      {
        ok: false,
        error: String(e),
      },
      {
        status: 500,
      }
    );
  }
}
