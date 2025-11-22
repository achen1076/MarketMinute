/*
  Sentinel configuration values used for anomaly detection
  and regime classification in a portfolio-agnostic setup.
*/
export const SENTINEL_CONFIG = {
  agentIntervalMinutes: 15,

  index: {
    dailyMoveThresholdPct: 1.5,
  },

  sector: {
    rotationThresholdPct: 2.0,
  },

  macro: {
    cpiSurprisePct: 0.15,
    jobsSurprise: 75000,
    fedRateSurpriseBps: 15,
  },

  volatility: {
    vixSpikePct: 8.0,
    realizedVolMultiplier: 1.8,
  },

  notifications: {
    enabled: true,
    cooldownMinutes: 120,
  },

  debug: {
    logs: false,
  },
};
