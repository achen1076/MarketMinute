/**
 * Clear all training data from database tables
 *
 * Run: npx tsx scripts/clear-training-data.ts
 */

import { prisma } from "@/lib/prisma";

async function clearTrainingData() {
  console.log("=".repeat(60));
  console.log("🗑️  Clearing Training Data Tables");
  console.log("=".repeat(60));

  try {
    // Delete all ticker news training data
    console.log("\n📰 Deleting ticker news training data...");
    const tickerResult = await prisma.tickerNewsTraining.deleteMany({});
    console.log(`✅ Deleted ${tickerResult.count} ticker news records`);

    // Delete all general news training data
    console.log("\n🌍 Deleting general news training data...");
    const generalResult = await prisma.generalNewsTraining.deleteMany({});
    console.log(`✅ Deleted ${generalResult.count} general news records`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Training data tables cleared successfully!");
    console.log("=".repeat(60));

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

clearTrainingData();
