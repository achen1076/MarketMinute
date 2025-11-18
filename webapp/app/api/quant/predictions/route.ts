import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Read the live predictions CSV from the quant_app folder
    const quantPath = join(
      process.cwd(),
      "../quant/outputs/live_predictions.csv"
    );
    const csvContent = await readFile(quantPath, "utf-8");

    // Parse CSV
    const lines = csvContent.trim().split("\n");
    const headers = lines[0].split(",");

    const predictions = lines.slice(1).map((line) => {
      const values = line.split(",");
      const obj: Record<string, any> = {};

      headers.forEach((header, i) => {
        const key = header.trim();
        const value = values[i]?.trim();

        if (key === "ticker" || key === "signal" || key === "timestamp") {
          obj[key] = value;
        } else if (key === "should_trade") {
          obj[key] = value === "True";
        } else if (value && !isNaN(parseFloat(value))) {
          obj[key] = parseFloat(value);
        } else {
          obj[key] = value;
        }
      });

      return obj;
    });

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Failed to load quant predictions:", error);
    return NextResponse.json(
      { error: "Failed to load predictions", predictions: [] },
      { status: 500 }
    );
  }
}
