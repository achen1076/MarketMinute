import { MarketSnapshot, MacroStream, MarketDrilldown } from "./types";

/*
  Returns the symbols that moved the most positively.
*/
function getLeaders(items: { symbol: string; changePct: number }[]) {
  const sorted = [...items].sort((a, b) => b.changePct - a.changePct);
  return sorted.slice(0, 3).map((x) => x.symbol);
}

/*
  Returns the symbols that moved the most negatively.
*/
function getLaggards(items: { symbol: string; changePct: number }[]) {
  const sorted = [...items].sort((a, b) => a.changePct - b.changePct);
  return sorted.slice(0, 3).map((x) => x.symbol);
}

/*
  Finds macro events that are relevant today or recently.
*/
function getMacroOverlap(macro: MacroStream) {
  return macro.events.slice(0, 5);
}

/*
  Performs deeper analysis of market anomalies.
*/
export function runMarketDrilldown(params: {
  market: MarketSnapshot;
  macro: MacroStream;
}): MarketDrilldown {
  const leadingIndices = getLeaders(params.market.indices);
  const laggingIndices = getLaggards(params.market.indices);

  const leadingSectors = getLeaders(params.market.sectors);
  const laggingSectors = getLaggards(params.market.sectors);

  const macroOverlap = getMacroOverlap(params.macro);

  return {
    leadingIndices,
    laggingIndices,
    leadingSectors,
    laggingSectors,
    macroOverlap,
  };
}
