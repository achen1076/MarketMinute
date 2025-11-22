import { runSentinelAgent } from "../agent/loop";

/*
  Runs Sentinel as a scheduled job.
*/
export async function runSentinelJob() {
  const result = await runSentinelAgent();

  console.log("Sentinel cycle complete:");
  console.log(result.report);
}
