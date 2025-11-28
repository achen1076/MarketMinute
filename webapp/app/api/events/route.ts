// app/api/events/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getBatchTickerEventsFromDb,
  setTickerEventsInDb,
  getMacroEventsFromDb,
  setMacroEventsInDb,
  cleanExpiredEventsFromDb,
  getSymbolsNeedingFetch,
  shouldFetchMacroEvents,
  type StockEvent,
  type MacroEvent,
} from "@/lib/eventsDb";
import { detectEventsFromNews } from "@/lib/eventDetector";

type UpcomingEventsResponse = {
  stockEvents: StockEvent[];
  macroEvents: MacroEvent[];
  fetchedAt: number;
};

/**
 * Fetch upcoming stock events (earnings, dividends) for a SINGLE ticker
 * Combines FMP API data with news-detected events
 */
async function fetchTickerEvents(symbol: string): Promise<StockEvent[]> {
  const events: StockEvent[] = [];

  // Detect events from news headlines (product launches, FDA, etc.)
  // try {
  //   const newsEvents = await detectEventsFromNews(symbol);
  //   events.push(...newsEvents);
  // } catch (error) {
  //   console.error(`[Events] News detection failed for ${symbol}:`, error);
  // }
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    console.warn("[Events] FMP_API_KEY not set, skipping API call");
    return events;
  }

  const today = new Date();
  const lookaheadDays = 30;
  const to = new Date(today.getTime() + lookaheadDays * 24 * 60 * 60 * 1000);

  const fromStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(to.getDate()).padStart(2, "0")}`;

  const upper = symbol.toUpperCase();

  try {
    // Build URLs
    const earningsUrl = new URL(
      "https://financialmodelingprep.com/stable/earnings"
    );
    earningsUrl.searchParams.set("symbol", upper);
    earningsUrl.searchParams.set("limit", "5");
    earningsUrl.searchParams.set("apikey", apiKey);

    const dividendUrl = new URL(
      "https://financialmodelingprep.com/stable/dividends"
    );
    dividendUrl.searchParams.set("symbol", upper);
    dividendUrl.searchParams.set("limit", "5");
    dividendUrl.searchParams.set("apikey", apiKey);

    const [earnRes, divRes] = await Promise.all([
      fetch(earningsUrl.toString(), { next: { revalidate: 60 * 60 } }),
      fetch(dividendUrl.toString(), { next: { revalidate: 60 * 60 } }),
    ]);

    const isUpcomingInWindow = (date: string | null | undefined) => {
      if (!date) return false;
      return date >= fromStr && date <= toStr;
    };

    // Earnings
    if (earnRes.ok) {
      const earningsData = (await earnRes.json()) as Array<{
        symbol: string;
        date: string;
        epsActual: number | null;
        epsEstimated: number | null;
        revenueActual: number | null;
        revenueEstimated: number | null;
      }>;

      for (const item of earningsData) {
        if (!isUpcomingInWindow(item.date)) continue;

        const descParts: string[] = [];
        if (item.epsEstimated != null) {
          const epsFormatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(item.epsEstimated);
          descParts.push(`Est. EPS: ${epsFormatted}`);
        }
        if (item.revenueEstimated != null) {
          // Format revenue in billions or millions
          const revBillions = item.revenueEstimated / 1_000_000_000;
          const revFormatted =
            revBillions >= 1
              ? `$${revBillions.toFixed(2)}B`
              : `$${(item.revenueEstimated / 1_000_000).toFixed(2)}M`;
          descParts.push(`Est. revenue: ${revFormatted}`);
        }

        events.push({
          symbol: upper,
          type: "earnings",
          title: `${upper} Earnings Report`,
          date: item.date,
          description: descParts.length ? descParts.join(" | ") : undefined,
          source: "api",
        });
      }
    }

    // Dividends
    if (divRes.ok) {
      const dividendData = (await divRes.json()) as Array<{
        symbol: string;
        date: string;
        dividend?: number;
        yield?: number;
        frequency?: string;
      }>;

      for (const item of dividendData) {
        if (!isUpcomingInWindow(item.date)) continue;

        const descParts: string[] = [];
        if (item.dividend != null) {
          const divFormatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          }).format(item.dividend);
          descParts.push(`${divFormatted}`);
        }
        if (item.yield != null) {
          const yieldPct = item.yield.toFixed(2);
          descParts.push(`Yield: ${yieldPct}%`);
        }
        if (item.frequency) {
          descParts.push(item.frequency);
        }

        events.push({
          symbol: upper,
          type: "dividend",
          title: `${upper} Dividend`,
          date: item.date,
          description: descParts.length ? descParts.join(" | ") : undefined,
          source: "api",
        });
      }
    }
  } catch (error) {
    console.error(`[Events] Failed to fetch events for ${symbol}:`, error);
  }

  return events;
}

/**
 * Fetch macro events - combines config with dynamic calculation
 * TODO: Replace with real economic calendar API
 */
async function fetchMacroEvents(): Promise<MacroEvent[]> {
  const today = new Date();
  const lookaheadDays = 45;
  const to = new Date(today.getTime() + lookaheadDays * 24 * 60 * 60 * 1000);

  // Use local date instead of UTC to avoid timezone issues
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(to.getDate()).padStart(2, "0")}`;

  // Generate upcoming FOMC meetings (typically 8 per year)
  const fomcDates = generateFOMCDates();

  // Generate CPI release dates (typically 2nd week of each month)
  const cpiDates = generateCPIDates();

  // Generate Jobs Report dates (first Friday of each month)
  const jobsDates = generateJobsReportDates();

  const config: MacroEvent[] = [
    // FOMC Meetings
    ...fomcDates.map((date) => ({
      type: "fomc" as const,
      title: "FOMC Meeting",
      date,
      description:
        "Federal Reserve interest rate decision and economic projections",
    })),

    // CPI Reports
    ...cpiDates.map((date) => ({
      type: "cpi" as const,
      title: "CPI Report",
      date,
      description: "Consumer Price Index - key inflation indicator",
    })),

    // Jobs Reports
    ...jobsDates.map((date) => ({
      type: "jobs" as const,
      title: "Non-Farm Payrolls",
      date,
      description: "Monthly employment report from Bureau of Labor Statistics",
    })),

    // Other key events (manually updated)
    {
      type: "gdp",
      title: "GDP Report Q4 2024",
      date: "2025-01-30",
      description: "Quarterly GDP growth rate",
    },
    {
      type: "other",
      title: "Treasury Quarterly Refunding",
      date: "2025-02-05",
      description: "Treasury debt issuance announcement",
    },
  ];

  return config.filter((e) => e.date >= todayStr && e.date <= toStr);
}

/**
 * Generate FOMC meeting dates (approximately every 6 weeks)
 */
function generateFOMCDates(): string[] {
  // 2025 FOMC schedule (from Fed website)
  return [
    "2025-01-29", // Jan 28-29
    "2025-03-19", // Mar 18-19
    "2025-05-07", // May 6-7
    "2025-06-18", // Jun 17-18
    "2025-07-30", // Jul 29-30
    "2025-09-17", // Sep 16-17
    "2025-11-05", // Nov 4-5
    "2025-12-17", // Dec 16-17
  ];
}

/**
 * Generate CPI release dates (typically mid-month)
 */
function generateCPIDates(): string[] {
  const dates: string[] = [];
  const currentDate = new Date();

  // Generate for next 3 months
  for (let i = 0; i < 3; i++) {
    const month = currentDate.getMonth() + i;
    const year = currentDate.getFullYear() + Math.floor(month / 12);
    const adjustedMonth = month % 12;

    // CPI typically released around 13th-15th of month
    const cpiDate = new Date(year, adjustedMonth, 13);
    dates.push(cpiDate.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Generate Jobs Report dates (first Friday of each month)
 */
function generateJobsReportDates(): string[] {
  const dates: string[] = [];
  const currentDate = new Date();

  // Generate for next 3 months
  for (let i = 0; i < 3; i++) {
    const month = currentDate.getMonth() + i;
    const year = currentDate.getFullYear() + Math.floor(month / 12);
    const adjustedMonth = month % 12;

    // Find first Friday of the month
    const firstDay = new Date(year, adjustedMonth, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 12 - dayOfWeek;
    const firstFriday = new Date(year, adjustedMonth, 1 + daysUntilFriday);

    dates.push(firstFriday.toISOString().split("T")[0]);
  }

  return dates;
}

// Request deduplication cache (prevents duplicate calls within 1 second)
const requestCache = new Map<
  string,
  { promise: Promise<NextResponse>; timestamp: number }
>();
const REQUEST_CACHE_TTL = 1000; // 1 second

// Cleanup old request cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > REQUEST_CACHE_TTL) {
      requestCache.delete(key);
    }
  }
}, 5000);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get("symbols");

    if (!symbolsParam) {
      return NextResponse.json(
        { error: "symbols parameter required" },
        { status: 400 }
      );
    }

    const symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    // Request deduplication: if same request within 1 second, return cached promise
    const cacheKey = `${session.user.email}:${symbols.sort().join(",")}`;
    const now = Date.now();
    const cached = requestCache.get(cacheKey);

    if (cached && now - cached.timestamp < REQUEST_CACHE_TTL) {
      return cached.promise;
    }

    // Create new request promise
    const requestPromise = (async () => {
      // Clean expired events from database
      await cleanExpiredEventsFromDb();

      // BATCH: Check which symbols need fresh data (1 query instead of N)
      const symbolsToFetch = Array.from(await getSymbolsNeedingFetch(symbols));

      // BATCH: Get cached events for all symbols (1 query instead of N)
      const cachedEventsMap = await getBatchTickerEventsFromDb(symbols);

      const stockEvents: StockEvent[] = [];

      // Add cached events
      for (const [symbol, events] of cachedEventsMap.entries()) {
        stockEvents.push(...events);
      }

      // Fetch fresh events for symbols that need it
      if (symbolsToFetch.length > 0) {
        const fetchPromises = symbolsToFetch.map(async (symbol) => {
          const events = await fetchTickerEvents(symbol);
          await setTickerEventsInDb(symbol, events);
          return events;
        });

        const results = await Promise.all(fetchPromises);
        stockEvents.push(...results.flat());
      }

      // Fetch macro events (24-hour caching)
      let macroEvents: MacroEvent[];
      const shouldFetchMacro = await shouldFetchMacroEvents();

      if (!shouldFetchMacro) {
        macroEvents = await getMacroEventsFromDb();
      } else {
        macroEvents = await fetchMacroEvents();
        // Store in database (updated_at timestamp tracks when fetched)
        await setMacroEventsInDb(macroEvents);
      }

      // Sort by date
      stockEvents.sort((a, b) => a.date.localeCompare(b.date));
      macroEvents.sort((a, b) => a.date.localeCompare(b.date));

      const response: UpcomingEventsResponse = {
        stockEvents,
        macroEvents,
        fetchedAt: Date.now(),
      };

      return NextResponse.json(response);
    })();

    // Cache the request promise
    requestCache.set(cacheKey, { promise: requestPromise, timestamp: now });

    return requestPromise;
  } catch (error) {
    console.error("[Events] Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
