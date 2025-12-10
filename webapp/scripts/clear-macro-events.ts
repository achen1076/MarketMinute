import { prisma } from "../lib/prisma";

async function clearMacroEvents() {
  console.log("Clearing all macro events from database...");

  const result = await prisma.macroEvent.deleteMany({});

  console.log(`✅ Deleted ${result.count} macro events`);
  console.log("Next API request will populate with official BLS/Fed dates");

  await prisma.$disconnect();
}

clearMacroEvents().catch((error) => {
  console.error("Error clearing macro events:", error);
  process.exit(1);
});
