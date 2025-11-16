import "server-only";
import { getSchwabAccessToken } from "@/lib/schwabAuth";

export type TickerSnapshot = {
  symbol: string;
  price: number;
  changePct: number;
};

export async function getSnapshotsForSymbols(
  symbols: string[]
): Promise<TickerSnapshot[]> {
  if (!symbols.length) return [];

  const accessToken = await getSchwabAccessToken();

  const url = new URL("https://api.schwabapi.com/marketdata/v1/quotes");
  url.searchParams.set("symbols", symbols.join(","));

  let res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 30 },
  });

  if (res.status === 401) {
    console.warn("[Schwab] 401 from quotes, forcing token refresh + retry");
    const newAccessToken = await getSchwabAccessToken();
    res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
      next: { revalidate: 30 },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("Schwab quotes error:", res.status, text);
    return symbols.map((symbol) => ({
      symbol: symbol.toUpperCase(),
      price: 0,
      changePct: 0,
    }));
  }

  const data = await res.json();

  return symbols.map((symbol) => {
    const key = symbol.toUpperCase();
    const q: any = data[key] ?? {};
    const quote = q.quote ?? {};
    const regular = q.regular ?? {};

    const price =
      regular.regularMarketLastPrice ?? quote.lastPrice ?? quote.mark ?? 0;

    const rawPct =
      regular.regularMarketPercentChange ??
      quote.netPercentChange ??
      quote.markPercentChange ??
      0;

    const changePct = rawPct;

    return {
      symbol: key,
      price: Number(price) || 0,
      changePct: Number(changePct) || 0,
    };
  });
}
