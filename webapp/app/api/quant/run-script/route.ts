import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { spawn } from "child_process";
import { join } from "path";

const ADMIN_EMAILS = ["achen1076@gmail.com"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { script } = await request.json();

    // Validate script name
    const validScripts = ["prep_data", "train_model", "generate_predictions"];
    if (!validScripts.includes(script)) {
      return NextResponse.json(
        { error: "Invalid script name" },
        { status: 400 }
      );
    }

    const quantAppPath = join(process.cwd(), "../quant");
    const scriptPath = `scripts/${script}.py`;

    // Return immediately with streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const pythonProcess = spawn("python3", [scriptPath], {
          cwd: quantAppPath,
          env: { ...process.env },
        });

        pythonProcess.stdout.on("data", (data) => {
          const text = data.toString();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ output: text })}\n\n`)
          );
        });

        pythonProcess.stderr.on("data", (data) => {
          const text = data.toString();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: text })}\n\n`)
          );
        });

        pythonProcess.on("close", (code) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, exitCode: code })}\n\n`
            )
          );
          controller.close();
        });

        pythonProcess.on("error", (err) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: err.message, done: true })}\n\n`
            )
          );
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to run script:", error);
    return NextResponse.json(
      { error: "Failed to run script" },
      { status: 500 }
    );
  }
}
