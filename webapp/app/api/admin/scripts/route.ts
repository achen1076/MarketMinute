import { auth } from "@/auth";
import { spawn } from "child_process";
import { join } from "path";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { script } = await req.json();

    // Path to quant directory
    const quantPath = join(process.cwd(), "../quant");

    let command: string;
    let args: string[];
    let description: string;

    switch (script) {
      case "setup":
        command = "pip";
        args = ["install", "-e", "."];
        description = "Environment setup";
        break;

      case "predictions":
        command = "python3";
        args = ["-u", "dashboards/generate_predictions.py"]; // -u for unbuffered output
        description = "Predictions generation";
        break;

      case "forecasts":
        command = "python3";
        args = ["-u", "scripts/generate_distributional_forecasts.py"]; // -u for unbuffered output
        description = "Distributional forecasts generation";
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid script name" }),
          { status: 400 }
        );
    }

    console.log(`Running ${description}: ${command} ${args.join(" ")} in ${quantPath}`);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const process = spawn(command, args, {
          cwd: quantPath,
        });

        process.stdout.on("data", (data) => {
          const text = data.toString();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ output: text })}\n\n`)
          );
        });

        process.stderr.on("data", (data) => {
          const text = data.toString();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: text })}\n\n`)
          );
        });

        process.on("close", (code) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, exitCode: code })}\n\n`
            )
          );
          controller.close();
        });

        process.on("error", (error) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.message, done: true, exitCode: 1 })}\n\n`
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
  } catch (error: any) {
    console.error("Script execution error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Script execution failed",
      }),
      { status: 500 }
    );
  }
}
