import { get_market_snapshot } from "../services/market/get_market_snapshot";
import { get_macro_event_stream } from "../services/macro/get_macro_event_stream";
import { get_realized_vol } from "../services/volatility/get_realized_volatility";
import { runTriggers } from "./triggers";
import { runMarketDrilldown } from "./drilldown";
import { buildSentinelContext } from "./context";
import { generateSpecialReport } from "./report";

/*
  Main Sentinel agent loop. Executes one full analysis cycle.
*/
export async function runSentinelAgent() {
  const market = await get_market_snapshot();
  const macro = await get_macro_event_stream();
  const volatility = await get_realized_vol();

  const anomalies = runTriggers({
    market,
    macro,
    volatility,
  });

  let drilldown = undefined;

  if (
    anomalies.indexMove ||
    anomalies.sectorRotation ||
    anomalies.macroSurprise ||
    anomalies.volSpike
  ) {
    drilldown = runMarketDrilldown({ market, macro });
  }

  const context = buildSentinelContext({
    market,
    macro,
    volatility,
    anomalies,
    drilldown,
  });

  const report = await generateSpecialReport(context);

  return {
    context,
    report,
  };
}
