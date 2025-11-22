import {
  MarketSnapshot,
  MacroStream,
  VolatilityData,
  AnomalyFlags,
  MarketDrilldown,
  SentinelContext,
} from "./types";

/*
  Builds a unified runtime context for a Sentinel cycle.
*/
export function buildSentinelContext(params: {
  market: MarketSnapshot;
  macro: MacroStream;
  volatility: VolatilityData;
  anomalies: AnomalyFlags;
  drilldown?: MarketDrilldown;
}): SentinelContext {
  return {
    market: params.market,
    macro: params.macro,
    volatility: params.volatility,
    anomalies: params.anomalies,
    drilldown: params.drilldown,
  };
}

/*
  Creates an empty fallback context.
*/
export function createEmptyContext(): SentinelContext {
  return {
    market: {
      indices: [],
      sectors: [],
      timestamp: new Date().toISOString(),
    },
    macro: {
      events: [],
    },
    volatility: {
      vix: null,
      vixChangePct: null,
      realizedVol: null,
      realizedVolPrev: null,
      volSpike: false,
      realizedVolSpike: false,
    },
    anomalies: {
      indexMove: false,
      sectorRotation: false,
      macroSurprise: false,
      volSpike: false,
    },
  };
}
