import "server-only";
import { prisma } from "@/lib/prisma";

export type TickerNewsTrainingData = {
  date: Date;
  ticker: string;
  headline: string;
  newsUrl?: string;
  stockChangePct: number;
  dowChangePct: number;
  spChangePct: number;
  nasdaqChangePct: number;
};

export type GeneralNewsTrainingData = {
  date: Date;
  headline: string;
  newsUrl?: string;
  dowChangePct: number;
  spChangePct: number;
  nasdaqChangePct: number;
};

/**
 * Store ticker news training data in the database
 * Uses upsert to avoid duplicates based on date + ticker + headline
 */
export async function storeTickerNewsTraining(
  data: TickerNewsTrainingData[]
): Promise<number> {
  try {
    const results = await prisma.$transaction(
      data.map((item) =>
        prisma.tickerNewsTraining.upsert({
          where: {
            date_ticker_headline: {
              date: item.date,
              ticker: item.ticker.toUpperCase(),
              headline: item.headline,
            },
          },
          create: {
            date: item.date,
            ticker: item.ticker.toUpperCase(),
            headline: item.headline,
            newsUrl: item.newsUrl,
            stockChangePct: item.stockChangePct,
            dowChangePct: item.dowChangePct,
            spChangePct: item.spChangePct,
            nasdaqChangePct: item.nasdaqChangePct,
          },
          update: {
            newsUrl: item.newsUrl,
            stockChangePct: item.stockChangePct,
            dowChangePct: item.dowChangePct,
            spChangePct: item.spChangePct,
            nasdaqChangePct: item.nasdaqChangePct,
          },
        })
      )
    );

    console.log(
      `[TrainingData] Stored ${results.length} ticker news training records`
    );
    return results.length;
  } catch (error) {
    console.error(
      "[TrainingData] Failed to store ticker news training:",
      error
    );
    throw error;
  }
}

/**
 * Store general news training data in the database
 * Uses upsert to avoid duplicates based on date + headline
 */
export async function storeGeneralNewsTraining(
  data: GeneralNewsTrainingData[]
): Promise<number> {
  try {
    const results = await prisma.$transaction(
      data.map((item) =>
        prisma.generalNewsTraining.upsert({
          where: {
            date_headline: {
              date: item.date,
              headline: item.headline,
            },
          },
          create: {
            date: item.date,
            headline: item.headline,
            newsUrl: item.newsUrl,
            dowChangePct: item.dowChangePct,
            spChangePct: item.spChangePct,
            nasdaqChangePct: item.nasdaqChangePct,
          },
          update: {
            newsUrl: item.newsUrl,
            dowChangePct: item.dowChangePct,
            spChangePct: item.spChangePct,
            nasdaqChangePct: item.nasdaqChangePct,
          },
        })
      )
    );

    console.log(
      `[TrainingData] Stored ${results.length} general news training records`
    );
    return results.length;
  } catch (error) {
    console.error(
      "[TrainingData] Failed to store general news training:",
      error
    );
    throw error;
  }
}

/**
 * Get ticker news training data for a specific date range
 */
export async function getTickerNewsTraining(
  startDate: Date,
  endDate: Date,
  ticker?: string
) {
  const where = {
    date: {
      gte: startDate,
      lte: endDate,
    },
    ...(ticker && { ticker: ticker.toUpperCase() }),
  };

  return await prisma.tickerNewsTraining.findMany({
    where,
    orderBy: {
      date: "desc",
    },
  });
}

/**
 * Get general news training data for a specific date range
 */
export async function getGeneralNewsTraining(startDate: Date, endDate: Date) {
  return await prisma.generalNewsTraining.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "desc",
    },
  });
}

/**
 * Get statistics about training data
 */
export async function getTrainingDataStats() {
  const [tickerCount, generalCount] = await Promise.all([
    prisma.tickerNewsTraining.count(),
    prisma.generalNewsTraining.count(),
  ]);

  return {
    tickerNewsCount: tickerCount,
    generalNewsCount: generalCount,
    totalCount: tickerCount + generalCount,
  };
}

/**
 * Clean old training data (older than specified days)
 */
export async function cleanOldTrainingData(daysToKeep: number = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const [deletedTicker, deletedGeneral] = await prisma.$transaction([
    prisma.tickerNewsTraining.deleteMany({
      where: {
        date: {
          lt: cutoffDate,
        },
      },
    }),
    prisma.generalNewsTraining.deleteMany({
      where: {
        date: {
          lt: cutoffDate,
        },
      },
    }),
  ]);

  const totalDeleted = deletedTicker.count + deletedGeneral.count;

  console.log(
    `[TrainingData] Cleaned ${totalDeleted} old records (ticker: ${deletedTicker.count}, general: ${deletedGeneral.count})`
  );

  return totalDeleted;
}
