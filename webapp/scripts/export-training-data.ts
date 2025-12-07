/**
 * Export training data from database to CSV files for manual sentiment labeling
 *
 * Run: npx tsx scripts/export-training-data.ts
 */

import { prisma } from "@/lib/prisma";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function exportTrainingData() {
  console.log("=".repeat(60));
  console.log("📊 Exporting Training Data to CSV");
  console.log("=".repeat(60));

  try {
    // Fetch ticker news training data
    console.log("\n📦 Fetching ticker news from database...");
    const tickerNews = await prisma.tickerNewsTraining.findMany({
      orderBy: { date: "desc" },
    });

    // Fetch general news training data
    console.log("📦 Fetching general news from database...");
    const generalNews = await prisma.generalNewsTraining.findMany({
      orderBy: { date: "desc" },
    });

    console.log(`✅ Fetched ${tickerNews.length} ticker news records`);
    console.log(`✅ Fetched ${generalNews.length} general news records`);

    // Prepare output directory
    const outputDir = join(process.cwd(), "../services/sentiment/data");
    mkdirSync(outputDir, { recursive: true });

    // Export ticker news to CSV
    if (tickerNews.length > 0) {
      const tickerCsvRows = [
        // Header
        "date,ticker,headline,sentiment,stockChangePct,dowChangePct,spChangePct,nasdaqChangePct,newsUrl",
        // Data rows
        ...tickerNews.map((row) => {
          const date = row.date.toISOString().split("T")[0];
          const headline = `"${row.headline.replace(/"/g, '""')}"`;
          const newsUrl = row.newsUrl ? `"${row.newsUrl}"` : "";
          return `${date},${row.ticker},${headline},,${row.stockChangePct},${row.dowChangePct},${row.spChangePct},${row.nasdaqChangePct},${newsUrl}`;
        }),
      ];

      const tickerCsvPath = join(
        outputDir,
        "ticker_news_training_unlabeled.csv"
      );
      writeFileSync(tickerCsvPath, tickerCsvRows.join("\n"), "utf-8");
      console.log(`\n✅ Exported ticker news to: ${tickerCsvPath}`);
    }

    // Export general news to CSV
    if (generalNews.length > 0) {
      const generalCsvRows = [
        // Header
        "date,headline,sentiment,dowChangePct,spChangePct,nasdaqChangePct,newsUrl",
        // Data rows
        ...generalNews.map((row) => {
          const date = row.date.toISOString().split("T")[0];
          const headline = `"${row.headline.replace(/"/g, '""')}"`;
          const newsUrl = row.newsUrl ? `"${row.newsUrl}"` : "";
          return `${date},${headline},,${row.dowChangePct},${row.spChangePct},${row.nasdaqChangePct},${newsUrl}`;
        }),
      ];

      const generalCsvPath = join(
        outputDir,
        "general_news_training_unlabeled.csv"
      );
      writeFileSync(generalCsvPath, generalCsvRows.join("\n"), "utf-8");
      console.log(`✅ Exported general news to: ${generalCsvPath}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📝 Next Steps:");
    console.log("=".repeat(60));
    console.log("1. Open the CSV files in your editor");
    console.log(
      "   - services/sentiment/data/ticker_news_training_unlabeled.csv"
    );
    console.log(
      "   - services/sentiment/data/general_news_training_unlabeled.csv"
    );
    console.log("");
    console.log("2. Fill in the 'sentiment' column with scores:");
    console.log("   - Range: -1.0 (very negative) to 1.0 (very positive)");
    console.log("   - Examples:");
    console.log("     • 'Stock crashes 20%' → -0.9");
    console.log("     • 'Company misses earnings' → -0.5");
    console.log("     • 'Quarterly results announced' → 0.0");
    console.log("     • 'Stock hits new high' → 0.8");
    console.log("     • 'Record breaking earnings' → 0.95");
    console.log("");
    console.log(
      "3. Save as new files (e.g., ticker_news_training_labeled.csv)"
    );
    console.log("4. Use for model training");
    console.log("=".repeat(60));

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

exportTrainingData();
