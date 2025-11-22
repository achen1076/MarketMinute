import { runSentinelAgent } from "./agent/loop";

async function main() {
  try {
    const result = await runSentinelAgent();

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║              📊 SENTINEL MARKET REPORT                 ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("📝 SUMMARY:");
    console.log(result.report.summary);
    console.log("\n");

    if (result.report.keyDrivers.length > 0) {
      console.log("🔑 KEY DRIVERS:");
      result.report.keyDrivers.forEach((driver, i) => {
        console.log(`  ${i + 1}. ${driver}`);
      });
      console.log("\n");
    }

    if (result.report.macroContext) {
      console.log("🌍 MACRO CONTEXT:");
      console.log(result.report.macroContext);
      console.log("\n");
    }

    if (result.report.scenarioQuestions.length > 0) {
      console.log("❓ SCENARIO QUESTIONS:");
      result.report.scenarioQuestions.forEach((q, i) => {
        console.log(`  ${i + 1}. ${q}`);
      });
      console.log("\n");
    }

    console.log("📈 ANOMALIES DETECTED:");
    const anomalies = result.context.anomalies;
    console.log(`  - Index Move: ${anomalies.indexMove ? "✅" : "❌"}`);
    console.log(
      `  - Sector Rotation: ${anomalies.sectorRotation ? "✅" : "❌"}`
    );
    console.log(`  - Macro Surprise: ${anomalies.macroSurprise ? "✅" : "❌"}`);
    console.log(`  - Vol Spike: ${anomalies.volSpike ? "✅" : "❌"}`);
    console.log("\n");

    console.log("💹 MARKET SNAPSHOT:");
    console.log(
      `  - Timestamp: ${new Date(
        result.context.market.timestamp
      ).toLocaleString()}`
    );
    console.log(
      `  - VIX: ${result.context.volatility.vix?.toFixed(2) || "N/A"}`
    );
    console.log(
      `  - VIX Change: ${
        result.context.volatility.vixChangePct?.toFixed(2) || "N/A"
      }%`
    );
    console.log("\n");
  } catch (err) {
    console.error("❌ Sentinel error:", err);
  }
}

main();
