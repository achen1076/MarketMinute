import { z } from "zod";

/*
  Index-level performance for major benchmarks and sectors.
*/
export const MarketIndexSchema = z.object({
  symbol: z.string(),
  changePct: z.number(),
  price: z.number().nullable(),
});

export type MarketIndex = z.infer<typeof MarketIndexSchema>;

/*
  Snapshot of overall market conditions for the cycle.
*/
export const MarketSnapshotSchema = z.object({
  indices: z.array(MarketIndexSchema),
  sectors: z.array(MarketIndexSchema),
  timestamp: z.string(),
});

export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;

/*
  Macro events such as CPI, Jobs, and FOMC.
*/
export const MacroEventSchema = z.object({
  type: z.enum(["CPI", "JOBS", "FED", "PCE", "GDP", "OTHER"]),
  date: z.string(),
  actual: z.number().nullable(),
  forecast: z.number().nullable(),
  previous: z.number().nullable(),
  surprise: z.number().nullable(),
  notes: z.string().optional(),
});

export type MacroEvent = z.infer<typeof MacroEventSchema>;

export const MacroStreamSchema = z.object({
  events: z.array(MacroEventSchema),
  latestCPI: MacroEventSchema.optional(),
  latestJobs: MacroEventSchema.optional(),
  latestFed: MacroEventSchema.optional(),
});

export type MacroStream = z.infer<typeof MacroStreamSchema>;

/*
  Volatility and regime indicators.
*/
export const VolatilitySchema = z.object({
  vix: z.number().nullable(),
  vixChangePct: z.number().nullable(),
  realizedVol: z.number().nullable(),
  realizedVolPrev: z.number().nullable(),
  volSpike: z.boolean(),
  realizedVolSpike: z.boolean(),
});

export type VolatilityData = z.infer<typeof VolatilitySchema>;

/*
  Anomaly detection results.
*/
export const AnomalyFlagsSchema = z.object({
  indexMove: z.boolean(),
  sectorRotation: z.boolean(),
  macroSurprise: z.boolean(),
  volSpike: z.boolean(),
});

export type AnomalyFlags = z.infer<typeof AnomalyFlagsSchema>;

/*
  Drilldown of market-level anomalies.
*/
export const MarketDrilldownSchema = z.object({
  leadingIndices: z.array(z.string()),
  laggingIndices: z.array(z.string()),
  leadingSectors: z.array(z.string()),
  laggingSectors: z.array(z.string()),
  macroOverlap: z.array(MacroEventSchema),
});

export type MarketDrilldown = z.infer<typeof MarketDrilldownSchema>;

/*
  What This Means - Structured narrative for user understanding.
*/
export const WhatThisMeansSchema = z.object({
  whatHappened: z.string(),
  whyItMatters: z.string(),
  whatCouldHappenNext: z.string(),
  whatToWatch: z.array(z.string()),
});

export type WhatThisMeans = z.infer<typeof WhatThisMeansSchema>;

/*
  LLM-generated special report.
*/
export const SpecialReportSchema = z.object({
  summary: z.string(),
  keyDrivers: z.array(z.string()),
  macroContext: z.string().nullable(),
  whatThisMeans: WhatThisMeansSchema.optional(),
});

export type SpecialReport = z.infer<typeof SpecialReportSchema>;

/*
  Unified Sentinel context for the current cycle.
*/
export const SentinelContextSchema = z.object({
  market: MarketSnapshotSchema,
  macro: MacroStreamSchema,
  volatility: VolatilitySchema,
  anomalies: AnomalyFlagsSchema,
  drilldown: MarketDrilldownSchema.optional(),
});

export type SentinelContext = z.infer<typeof SentinelContextSchema>;
