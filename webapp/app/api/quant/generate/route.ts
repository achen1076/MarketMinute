import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";

const execAsync = promisify(exec);

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
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
