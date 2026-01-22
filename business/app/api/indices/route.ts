import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSnapshotsForSymbols } from "@shared/lib/marketData";

const MAJOR_INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "NASDAQ" },
];

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const symbols = MAJOR_INDICES.map((i) => i.symbol);
  const snapshots = await getSnapshotsForSymbols(symbols);

  const indices = MAJOR_INDICES.map((index) => {
    const snapshot = snapshots.find((s) => s.symbol === index.symbol);
    return {
      symbol: index.symbol,
      name: index.name,
      price: snapshot?.price ?? 0,
      changePct: snapshot?.changePct ?? 0,
    };
  });

  return NextResponse.json({ indices });
}
