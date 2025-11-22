// webapp/lib/eventsDb.ts
import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Database-backed event storage
 * Replaces in-memory cache with persistent PostgreSQL storage
 */

export type StockEvent = {
  symbol: string;
  type: "earnings" | "dividend" | "conference" | "other";
  title: string;
  date: string; // ISO date string
  description?: string;
  source?: "api" | "news";
};

export type MacroEvent = {
  type: "fomc" | "cpi" | "jobs" | "gdp" | "other";
  title: string;
  date: string; // ISO date string
  description?: string;
};

/**
 * Get ticker events from database
 * Returns events for the specified symbol that haven't expired
 */
export async function getTickerEventsFromDb(
  symbol: string
): Promise<StockEvent[]> {
  const today = new Date().toISOString().split("T")[0];
  const upper = symbol.toUpperCase();

  const events = await prisma.tickerEvent.findMany({
    where: {
      symbol: upper,
      date: {
        gte: today, // Only future events
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return events.map((e) => ({
    symbol: e.symbol,
    type: e.type as StockEvent["type"],
    title: e.title,
    date: e.date,
    description: e.description ?? undefined,
    source: (e.source as StockEvent["source"]) ?? undefined,
  }));
}

/**
 * Store ticker events in database
 * Uses upsert to avoid duplicates
 */
export async function setTickerEventsInDb(
  symbol: string,
  events: StockEvent[]
): Promise<void> {
  const upper = symbol.toUpperCase();

  // Use transactions for atomic upserts
  await prisma.$transaction(
    events.map((event) =>
      prisma.tickerEvent.upsert({
        where: {
          symbol_type_date: {
            symbol: upper,
            type: event.type,
            date: event.date,
          },
        },
        create: {
          symbol: upper,
          type: event.type,
          title: event.title,
          date: event.date,
          description: event.description,
          source: event.source,
        },
        update: {
          title: event.title,
          description: event.description,
          source: event.source,
        },
      })
    )
  );

  console.log(`[Events][DB] Stored ${events.length} events for ${upper}`);
}

/**
 * Get macro events from database
 * Returns events that haven't expired
 */
export async function getMacroEventsFromDb(): Promise<MacroEvent[]> {
  const today = new Date().toISOString().split("T")[0];

  const events = await prisma.macroEvent.findMany({
    where: {
      date: {
        gte: today, // Only future events
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return events.map((e) => ({
    type: e.type as MacroEvent["type"],
    title: e.title,
    date: e.date,
    description: e.description ?? undefined,
  }));
}

/**
 * Store macro events in database
 * Uses upsert to avoid duplicates
 */
export async function setMacroEventsInDb(
  events: MacroEvent[]
): Promise<void> {
  // Use transactions for atomic upserts
  await prisma.$transaction(
    events.map((event) =>
      prisma.macroEvent.upsert({
        where: {
          type_date: {
            type: event.type,
            date: event.date,
          },
        },
        create: {
          type: event.type,
          title: event.title,
          date: event.date,
          description: event.description,
        },
        update: {
          title: event.title,
          description: event.description,
        },
      })
    )
  );

  console.log(`[Events][DB] Stored ${events.length} macro events`);
}

/**
 * Clean expired events from database
 * Removes events whose date has passed
 */
export async function cleanExpiredEventsFromDb(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];

  const [deletedTicker, deletedMacro] = await prisma.$transaction([
    prisma.tickerEvent.deleteMany({
      where: {
        date: {
          lt: today,
        },
      },
    }),
    prisma.macroEvent.deleteMany({
      where: {
        date: {
          lt: today,
        },
      },
    }),
  ]);

  const totalDeleted = deletedTicker.count + deletedMacro.count;

  if (totalDeleted > 0) {
    console.log(
      `[Events][DB] Cleaned ${totalDeleted} expired events (ticker: ${deletedTicker.count}, macro: ${deletedMacro.count})`
    );
  }

  return totalDeleted;
}

/**
 * Check if events exist for a symbol in the database
 */
export async function hasTickerEventsInDb(symbol: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const upper = symbol.toUpperCase();

  const count = await prisma.tickerEvent.count({
    where: {
      symbol: upper,
      date: {
        gte: today,
      },
    },
  });

  console.log(`[Events][DB] Check for ${upper}: found ${count} events (today: ${today})`);
  return count > 0;
}

/**
 * Check if macro events exist in the database
 */
export async function hasMacroEventsInDb(): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];

  const count = await prisma.macroEvent.count({
    where: {
      date: {
        gte: today,
      },
    },
  });

  return count > 0;
}

/**
 * Get database statistics for events
 */
export async function getEventsDbStats() {
  const [tickerCount, macroCount] = await Promise.all([
    prisma.tickerEvent.count(),
    prisma.macroEvent.count(),
  ]);

  return {
    size: tickerCount + macroCount,
    tickerEvents: tickerCount,
    macroEvents: macroCount,
  };
}

/**
 * Clear all events from database
 */
export async function clearEventsDb(): Promise<number> {
  const [deletedTicker, deletedMacro] = await prisma.$transaction([
    prisma.tickerEvent.deleteMany({}),
    prisma.macroEvent.deleteMany({}),
  ]);

  const totalDeleted = deletedTicker.count + deletedMacro.count;

  console.log(
    `[Events][DB] Cleared ${totalDeleted} events (ticker: ${deletedTicker.count}, macro: ${deletedMacro.count})`
  );

  return totalDeleted;
}
