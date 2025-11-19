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
    // Read the distributional forecasts CSV from the quant_app folder
    const quantPath = join(
      process.cwd(),
      "../quant/outputs/distributional_forecasts.csv"
    );
    const csvContent = await readFile(quantPath, "utf-8");

    // Parse CSV
    const lines = csvContent.trim().split("\n");
    const headers = lines[0].split(",");

    const forecasts = lines.slice(1).map((line) => {
      const values = line.split(",");
      const obj: Record<string, any> = {};

      headers.forEach((header, i) => {
        const key = header.trim();
        const value = values[i]?.trim();

        if (key === "ticker" || key === "timestamp" || key === "directional_bias" || 
            key === "conviction" || key === "most_likely_category") {
          obj[key] = value;
        } else if (value && !isNaN(parseFloat(value))) {
          obj[key] = parseFloat(value);
        } else {
          obj[key] = value;
        }
      });

      return obj;
    });

    return NextResponse.json({ forecasts });
  } catch (error) {
    console.error("Failed to load distributional forecasts:", error);
    return NextResponse.json(
      { error: "Failed to load forecasts", forecasts: [] },
      { status: 500 }
    );
  }
}
