type FmpQuoteRow = Record<string, any>;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export async function fetchFmpQuoteSnapshot(
  tickers: string[]
): Promise<FmpQuoteRow[]> {
  const apiKey = requireEnv("FMP_API_KEY");

  const symbols = tickers.join(",");
  const url = `https://financialmodelingprep.com/stable/batch-quote?symbols=${encodeURIComponent(
    symbols
  )}&apikey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `FMP quote fetch failed: ${res.status} ${res.statusText} ${body}`
    );
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];

  return data as FmpQuoteRow[];
}
