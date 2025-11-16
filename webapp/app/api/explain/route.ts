import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { symbol, changePct } = await req.json();

  // TODO: later fetch news + run through LLM.
  // For now, fake something based purely on the move size.
  let explanation: string;

  if (Math.abs(changePct) < 1) {
    explanation = `${symbol} is basically flat today. Most likely just normal intraday noise with no strong catalysts.`;
  } else if (changePct > 0) {
    explanation = `${symbol} is up ${changePct.toFixed(
      2
    )}%. That could be driven by positive news, an analyst upgrade, or strength in its sector.`;
  } else {
    explanation = `${symbol} is down ${changePct.toFixed(
      2
    )}%. Could be related to negative headlines, downgrades, or broader weakness in its sector.`;
  }

  return NextResponse.json({ explanation });
}
