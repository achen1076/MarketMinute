import { prisma } from "../lib/prisma";

async function deleteNewsToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log(
    `Deleting news items created today (since ${today.toISOString()})...`
  );

  const result = await prisma.newsItem.deleteMany({
    where: {
      createdAt: {
        gte: today,
      },
    },
  });

  console.log(`✅ Deleted ${result.count} news items created today`);
  await prisma.$disconnect();
}

deleteNewsToday().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
