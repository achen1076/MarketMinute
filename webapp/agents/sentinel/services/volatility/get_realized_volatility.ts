import { VolatilityData } from "../../agent/types";
import { SENTINEL_ENV } from "../../config/env";

/*
  Fetch daily historical bars from FMP for SPY.
*/
async function fetchFMPDailyBars(
  symbol: string,
  days: number
): Promise<{ close: number }[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error("[Sentinel] FMP API key not configured");
    return [];
  }

  // Calculate date range (last N days)
  const toDate = new Date().toISOString().split("T")[0];
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${symbol}&from=${fromDate}&to=${toDate}&apikey=${apiKey}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Sentinel] FMP price history error ${res.status}:`, text);
    return [];
  }

  const data: any = await res.json();

  if (!Array.isArray(data)) return [];

  return data.map((bar: any) => ({
    close: bar.close,
  }));
}

/*
  Computes realized volatility from daily returns.
*/
function computeRealizedVol(values: number[]): number | null {
  if (values.length < 5) return null;

  const returns = [];

  for (let i = 1; i < values.length; i++) {
    const r = (values[i] - values[i - 1]) / values[i - 1];
    returns.push(r);
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  const variance =
    returns.map((r) => Math.pow(r - mean, 2)).reduce((sum, x) => sum + x, 0) /
    returns.length;

  const dailyVol = Math.sqrt(variance);
  const annualized = dailyVol * Math.sqrt(252);

  return annualized;
}

/*
  Fetch live VIX data from Yahoo Finance.
*/
async function fetchYahooVIX(): Promise<{
  vix: number | null;
  pct: number | null;
}> {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=2d";

  const res = await fetch(url);
  const data: any = await res.json();

  const result = data?.chart?.result?.[0];

  if (!result) return { vix: null, pct: null };

  const closes = result.indicators.quote[0].close;
  if (!closes || closes.length < 2) return { vix: null, pct: null };

  const prev = closes[0];
  const curr = closes[1];

  const pct = prev ? ((curr - prev) / prev) * 100 : null;

  return {
    vix: curr ?? null,
    pct,
  };
}

/*
  Fetch official VIXCLS close from FRED.
*/
async function fetchFredVIXClose(): Promise<number | null> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=VIXCLS&api_key=${SENTINEL_ENV.FRED_API_KEY}&file_type=json`;

  const res = await fetch(url);
  const data: any = await res.json();

  const obs = data?.observations;
  if (!Array.isArray(obs) || obs.length === 0) return null;

  const last = obs[obs.length - 1];

  const val = parseFloat(last.value);
  return isNaN(val) ? null : val;
}

/*
  Returns the full volatility structure consumed by Sentinel.
*/
export async function get_realized_vol(): Promise<VolatilityData> {
  const bars = await fetchFMPDailyBars("SPY", 50);
  const closePrices = bars.map((b: { close: number }) => b.close);

  const realized = computeRealizedVol(closePrices.slice(-20));
  const realizedPrev = computeRealizedVol(closePrices.slice(-40, -20));

  const vixLive = await fetchYahooVIX();
  const vixCLS = await fetchFredVIXClose();

  const volSpike = vixLive.pct !== null && vixLive.pct > 8;

  const realizedVolSpike =
    realized !== null && realizedPrev !== null && realized > realizedPrev * 1.8;

  return {
    vix: vixLive.vix ?? vixCLS ?? null,
    vixChangePct: vixLive.pct,
    realizedVol: realized,
    realizedVolPrev: realizedPrev,
    volSpike,
    realizedVolSpike,
  };
}
