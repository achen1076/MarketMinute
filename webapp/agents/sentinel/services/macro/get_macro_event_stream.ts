import { MacroEvent, MacroStream } from "../../agent/types";
import { SENTINEL_ENV } from "../../config/env";

/*
  Helper to fetch JSON safely.
*/
async function fetchJSON(url: string) {
  const res = await fetch(url);
  return res.json();
}

/*
  Fetch CPI event from FMP.
*/
async function loadCPIEvent(): Promise<MacroEvent | null> {
  const url = `https://financialmodelingprep.com/api/v4/economic?name=cpi&apikey=${SENTINEL_ENV.FMP_API_KEY}`;
  const data = await fetchJSON(url);

  if (!Array.isArray(data) || data.length === 0) return null;

  const e = data[0];

  return {
    type: "CPI",
    date: e.date || "",
    actual: e.actual || null,
    forecast: e.estimate || null,
    previous: e.previous || null,
    surprise: e.actual && e.estimate ? e.actual - e.estimate : null,
  };
}

/*
  Fetch Nonfarm Payrolls (Jobs Report) from FMP.
*/
async function loadJobsEvent(): Promise<MacroEvent | null> {
  const url = `https://financialmodelingprep.com/api/v4/economic?name=nonfarm_payroll&apikey=${SENTINEL_ENV.FMP_API_KEY}`;
  const data = await fetchJSON(url);

  if (!Array.isArray(data) || data.length === 0) return null;

  const e = data[0];

  return {
    type: "JOBS",
    date: e.date || "",
    actual: e.actual || null,
    forecast: e.estimate || null,
    previous: e.previous || null,
    surprise: e.actual && e.estimate ? e.actual - e.estimate : null,
  };
}

/*
  Fetch the latest FOMC rate decision from FMP.
*/
async function loadFedEvent(): Promise<MacroEvent | null> {
  const url = `https://financialmodelingprep.com/api/v4/economic?name=fed_interest_rate&apikey=${SENTINEL_ENV.FMP_API_KEY}`;
  const data = await fetchJSON(url);

  if (!Array.isArray(data) || data.length === 0) return null;

  const e = data[0];

  return {
    type: "FED",
    date: e.date || "",
    actual: e.actual || null,
    forecast: e.estimate || null,
    previous: e.previous || null,
    surprise: e.actual && e.estimate ? e.actual - e.estimate : null,
  };
}

/*
  Load a full economic event stream from FMP
  (optional, but useful for richer context).
*/
async function loadAllMacroEvents(): Promise<MacroEvent[]> {
  const url = `https://financialmodelingprep.com/api/v4/economic_calendar?apikey=${SENTINEL_ENV.FMP_API_KEY}`;
  const data = await fetchJSON(url);

  if (!Array.isArray(data)) return [];

  return data.slice(0, 25).map((e: any) => ({
    type: "OTHER",
    date: e.date || "",
    actual: e.actual || null,
    forecast: e.estimate || null,
    previous: e.previous || null,
    surprise: e.actual && e.estimate ? e.actual - e.estimate : null,
    notes: e.event,
  }));
}

/*
  Returns the full MacroStream object for Sentinel.
*/
export async function get_macro_event_stream(): Promise<MacroStream> {
  const [cpi, jobs, fed, all] = await Promise.all([
    loadCPIEvent(),
    loadJobsEvent(),
    loadFedEvent(),
    loadAllMacroEvents(),
  ]);

  const events: MacroEvent[] = [];

  if (cpi) events.push(cpi);
  if (jobs) events.push(jobs);
  if (fed) events.push(fed);

  return {
    events: [...events, ...all],
    latestCPI: cpi || undefined,
    latestJobs: jobs || undefined,
    latestFed: fed || undefined,
  };
}
