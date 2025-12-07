import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const execAsync = promisify(exec);

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Rate limit: 3 prediction generations per 5 minutes per user
  const rateLimitResult = checkRateLimit("quant:generate", session.user.email, {
    maxRequests: 3,
    windowSeconds: 300,
  });

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    // Path to the quant prediction script
    const quantPath = join(process.cwd(), "../../quant");

    // Run the prediction generation script
    const { stdout, stderr } = await execAsync(
      "python3 generate_predictions.py",
      {
        cwd: quantPath,
        timeout: 60000, // 60 second timeout
      }
    );

    if (stderr && !stderr.includes("FutureWarning")) {
      console.error("Prediction generation warnings:", stderr);
    }

    return NextResponse.json({
      success: true,
      message: "Predictions generated successfully",
      output: stdout,
    });
  } catch (error: any) {
    console.error("Failed to generate predictions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate predictions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
