import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Database-backed event storage
 * - Database: Persistent storage for events with timestamps
 * - Events only refetch from external APIs once per 24 hours based on DB updated_at
 */

export type StockEvent = {
  symbol: string;
  type: "earnings" | "dividend" | "conference" | "other";
  title: string;
  date: string;
  description?: string;
  source?: "api" | "news";
};

export type MacroEvent = {
  type: "fomc" | "cpi" | "jobs" | "gdp" | "other";
  title: string;
  date: string;
  description?: string;
};

/**
 * Get ticker events from database for multiple symbols (BATCH)
 * Returns events grouped by symbol
 */
export async function getBatchTickerEventsFromDb(
  symbols: string[]
): Promise<Map<string, StockEvent[]>> {
  const today = new Date().toISOString().split("T")[0];
  const upperSymbols = symbols.map((s) => s.toUpperCase());

  const events = await prisma.tickerEvent.findMany({
    where: {
      symbol: {
        in: upperSymbols,
      },
      date: {
        gte: today,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Group events by symbol
  const grouped = new Map<string, StockEvent[]>();
  for (const event of events) {
    if (event.title === "No upcoming events") continue;

    const stockEvent: StockEvent = {
      symbol: event.symbol,
      type: event.type as StockEvent["type"],
      title: event.title,
      date: event.date,
      description: event.description ?? undefined,
      source: (event.source as StockEvent["source"]) ?? undefined,
    };

    if (!grouped.has(event.symbol)) {
      grouped.set(event.symbol, []);
    }
    grouped.get(event.symbol)!.push(stockEvent);
  }

  return grouped;
}

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
        gte: today,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return events
    .filter((e) => e.title !== "No upcoming events")
    .map((e) => ({
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

  if (events.length === 0) {
    const sentinelDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    await prisma.tickerEvent.upsert({
      where: {
        symbol_type_date: {
          symbol: upper,
          type: "other",
          date: sentinelDate,
        },
      },
      create: {
        symbol: upper,
        type: "other",
        title: `No upcoming events`,
        date: sentinelDate,
        description: "Checked API - no events in next 30 days",
        source: "api",
      },
      update: {
        // Just update timestamp by re-creating same record
        title: `No upcoming events`,
        description: "Checked API - no events in next 30 days",
      },
    });
    return;
  }

  // Use transactions for atomic upserts
  try {
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
  } catch (error) {
    console.error(`[Events][DB] Failed to store events for ${upper}:`, error);
    throw error;
  }
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
export async function setMacroEventsInDb(events: MacroEvent[]): Promise<void> {
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
}

/**
 * Clean expired events from database
 * Removes events whose date has passed
 * DISABLED: DELETE operations removed to reduce DB load
 */
export async function cleanExpiredEventsFromDb(): Promise<number> {
  // const today = new Date().toISOString().split("T")[0];
  // const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // const [deletedExpired, deletedOldSentinels, deletedMacro] =
  //   await prisma.$transaction([
  //     // Delete past events
  //     prisma.tickerEvent.deleteMany({
  //       where: {
  //         date: {
  //           lt: today,
  //         },
  //       },
  //     }),
  //     // Delete old sentinel records (force refetch if >7 days old)
  //     prisma.tickerEvent.deleteMany({
  //       where: {
  //         title: "No upcoming events",
  //         updatedAt: {
  //           lt: sevenDaysAgo,
  //         },
  //       },
  //     }),
  //     prisma.macroEvent.deleteMany({
  //       where: {
  //         date: {
  //           lt: today,
  //         },
  //       },
  //     }),
  //   ]);

  // const totalDeleted =
  //   deletedExpired.count + deletedOldSentinels.count + deletedMacro.count;

  // return totalDeleted;
  return 0;
}

/**
 * Check which symbols need fresh data from API (BATCH)
 * Returns set of symbols that need fetching
 */
export async function getSymbolsNeedingFetch(
  symbols: string[]
): Promise<Set<string>> {
  const today = new Date().toISOString().split("T")[0];
  const upperSymbols = symbols.map((s) => s.toUpperCase());

  // Get most recent event for each symbol
  const recentEvents = await prisma.tickerEvent.findMany({
    where: {
      symbol: {
        in: upperSymbols,
      },
      date: { gte: today },
    },
    orderBy: {
      updatedAt: "desc",
    },
    distinct: ["symbol"],
  });

  const symbolsWithData = new Set<string>();
  const staleSymbols = new Set<string>();

  for (const event of recentEvents) {
    symbolsWithData.add(event.symbol);

    const age = Date.now() - event.updatedAt.getTime();
    const ageHours = age / (1000 * 60 * 60);

    if (ageHours >= 24) {
      staleSymbols.add(event.symbol);
    }
  }

  // Symbols that need fetching: either not in DB or stale
  const needFetching = new Set<string>();
  for (const symbol of upperSymbols) {
    if (!symbolsWithData.has(symbol) || staleSymbols.has(symbol)) {
      needFetching.add(symbol);
    }
  }

  return needFetching;
}

/**
 * Check if we should fetch ticker events from API
 * Checks DB updated_at timestamp - refetch if older than 24 hours
 */
export async function shouldFetchTickerEvents(
  symbol: string
): Promise<boolean> {
  const upper = symbol.toUpperCase();
  const today = new Date().toISOString().split("T")[0];

  // Get most recent event for this symbol
  const recentEvent = await prisma.tickerEvent.findFirst({
    where: {
      symbol: upper,
      date: { gte: today },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!recentEvent) return true;

  const age = Date.now() - recentEvent.updatedAt.getTime();
  const ageHours = age / (1000 * 60 * 60);

  return ageHours >= 24;
}

/**
 * Check if we should fetch macro events from API
 * Checks DB updated_at timestamp - refetch if older than 24 hours
 */
export async function shouldFetchMacroEvents(): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];

  // Get most recent macro event
  const recentEvent = await prisma.macroEvent.findFirst({
    where: {
      date: { gte: today },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!recentEvent) return true;

  const age = Date.now() - recentEvent.updatedAt.getTime();
  const ageHours = age / (1000 * 60 * 60);

  return ageHours >= 24;
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
