import {
  MarketSnapshot,
  MacroStream,
  VolatilityData,
  AnomalyFlags,
} from "./types";
import { SENTINEL_CONFIG } from "../config/sentinel.config";

/*
  Detects unusual index movements such as SPY/QQQ/IWM large swings.
*/
function detectIndexMove(market: MarketSnapshot): boolean {
  const threshold = SENTINEL_CONFIG.index.dailyMoveThresholdPct;

  for (const idx of market.indices) {
    if (Math.abs(idx.changePct) >= threshold) {
      return true;
    }
  }

  return false;
}

/*
  Detects sector rotation by checking if any sector moves beyond threshold.
*/
function detectSectorRotation(market: MarketSnapshot): boolean {
  const threshold = SENTINEL_CONFIG.sector.rotationThresholdPct;

  for (const sector of market.sectors) {
    if (Math.abs(sector.changePct) >= threshold) {
      return true;
    }
  }

  return false;
}

/*
  Detects macro surprises such as CPI/JOBS/FED deviating from forecasts.
*/
function detectMacroSurprise(macro: MacroStream): boolean {
  const cpiT = SENTINEL_CONFIG.macro.cpiSurprisePct;
  const jobsT = SENTINEL_CONFIG.macro.jobsSurprise;
  const fedT = SENTINEL_CONFIG.macro.fedRateSurpriseBps;

  const cpi = macro.latestCPI;
  if (cpi && cpi.surprise !== null) {
    const pct = cpi.forecast ? Math.abs(cpi.surprise / cpi.forecast) : 0;

    if (pct >= cpiT) return true;
  }

  const jobs = macro.latestJobs;
  if (jobs && jobs.surprise !== null) {
    if (Math.abs(jobs.surprise) >= jobsT) return true;
  }

  const fed = macro.latestFed;
  if (fed && fed.surprise !== null) {
    if (Math.abs(fed.surprise * 100) >= fedT) return true;
  }

  return false;
}

/*
  Detects volatility regime spikes based on VIX or realized vol.
*/
function detectVolSpike(vol: VolatilityData): boolean {
  if (vol.volSpike) return true;
  if (vol.realizedVolSpike) return true;
  return false;
}

/*
  Combines all anomaly detection into a single flags object.
*/
export function runTriggers(params: {
  market: MarketSnapshot;
  macro: MacroStream;
  volatility: VolatilityData;
}): AnomalyFlags {
  return {
    indexMove: detectIndexMove(params.market),
    sectorRotation: detectSectorRotation(params.market),
    macroSurprise: detectMacroSurprise(params.macro),
    volSpike: detectVolSpike(params.volatility),
  };
}
