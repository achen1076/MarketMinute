import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// S3 configuration
const S3_BUCKET =
  process.env.MODEL_METADATA_S3_BUCKET || "marketminute-quant-models";
const S3_KEY = process.env.MODEL_METADATA_S3_KEY || "model_metadata.json";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

export type ModelQuality = {
  ticker: string;
  model_type: string;
  sharpe_ratio: number;
  profit_factor: number | null;
  win_rate: number;
  num_trades: number;
  accuracy: number;
  max_drawdown: number;
  total_return: number;
  samples: number;
  deployable: boolean;
  quality_tier: "excellent" | "good" | "marginal" | "poor";
  trained_at: string;
};

// Cache the metadata for 1 hour
let cachedMetadata: Record<string, ModelQuality> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const s3Client = new S3Client({ region: AWS_REGION });

async function fetchModelMetadata(): Promise<Record<string, ModelQuality>> {
  const now = Date.now();

  if (cachedMetadata && now - cacheTimestamp < CACHE_DURATION) {
    return cachedMetadata;
  }

  try {
    // Fetch from S3
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: S3_KEY,
    });

    const response = await s3Client.send(command);
    const bodyContents = await response.Body?.transformToString();

    if (bodyContents) {
      const data = JSON.parse(bodyContents);
      cachedMetadata = data.models || {};
      cacheTimestamp = now;
      return cachedMetadata ?? {};
    }

    return {};
  } catch (error) {
    console.error("Failed to fetch model metadata from S3:", error);
    return cachedMetadata ?? {};
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const metadata = await fetchModelMetadata();

    // Transform to a simpler format keyed by ticker
    const byTicker: Record<string, ModelQuality> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const ticker = value.ticker;
      byTicker[ticker] = value;
    }

    return NextResponse.json({
      models: byTicker,
      count: Object.keys(byTicker).length,
    });
  } catch (error) {
    console.error("Failed to load model metadata:", error);
    return NextResponse.json(
      { error: "Failed to load model metadata", models: {} },
      { status: 500 }
    );
  }
}
