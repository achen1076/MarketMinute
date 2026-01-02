import { prisma } from "../lib/prisma";

async function testNewsSummaries() {
  console.log("=== Testing News Summaries ===\n");

  // Check database for news items with summaries
  const newsWithSummaries = await prisma.newsItem.findMany({
    where: {
      summary: { not: null },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  console.log(
    `📊 News items with AI summaries in DB: ${newsWithSummaries.length}`
  );
  if (newsWithSummaries.length > 0) {
    console.log("\nSample news with summaries:");
    for (const item of newsWithSummaries) {
      console.log(`\n  Ticker: ${item.ticker}`);
      console.log(`  Headline: ${item.headline.substring(0, 60)}...`);
      console.log(`  Summary: ${item.summary?.substring(0, 100)}...`);
      console.log(
        `  Relevance: ${item.relevance.toFixed(
          2
        )}, Sentiment: ${item.sentiment.toFixed(2)}`
      );
    }
  }

  // Check total news items
  const totalNews = await prisma.newsItem.count();
  const newsWithSummaryCount = await prisma.newsItem.count({
    where: { summary: { not: null } },
  });
  console.log(`\n📈 Total news items: ${totalNews}`);
  console.log(`📝 News with summaries: ${newsWithSummaryCount}`);

  // Test what getAnalyzedNewsForSymbol would return (simulate)
  const testTickers = ["AAPL", "NVDA", "TSLA"];
  console.log("\n=== Testing Database News Retrieval ===\n");

  const since = new Date();
  since.setDate(since.getDate() - 3);

  for (const ticker of testTickers) {
    const dbNews = await prisma.newsItem.findMany({
      where: {
        ticker: ticker.toUpperCase(),
        createdAt: { gte: since },
      },
      orderBy: [{ relevance: "desc" }, { createdAt: "desc" }],
      take: 3,
    });

    console.log(`\n${ticker}: Found ${dbNews.length} news items in DB`);
    for (const item of dbNews) {
      console.log(`  - ${item.headline.substring(0, 50)}...`);
      console.log(
        `    Summary: ${
          item.summary ? item.summary.substring(0, 80) + "..." : "(none)"
        }`
      );
      console.log(
        `    Relevance: ${item.relevance.toFixed(
          2
        )}, Sentiment: ${item.sentiment.toFixed(2)}`
      );
    }
  }

  await prisma.$disconnect();
}

testNewsSummaries().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
