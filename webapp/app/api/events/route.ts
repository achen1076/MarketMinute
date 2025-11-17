// app/api/events/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getTickerEventsFromCache,
  setTickerEventsInCache,
  getMacroEventsFromCache,
  setMacroEventsInCache,
  cleanExpiredEvents,
  type StockEvent,
  type MacroEvent,
} from "@/lib/eventsCache";

type UpcomingEventsResponse = {
  stockEvents: StockEvent[];
  macroEvents: MacroEvent[];
  fetchedAt: number;
};

/**
 * Fetch upcoming stock events (earnings, dividends) for a SINGLE ticker
 * using Financial Modeling Prep "stable" APIs
 */
async function fetchTickerEvents(symbol: string): Promise<StockEvent[]> {
  const events: StockEvent[] = [];
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
        });
      }
    }
  } catch (error) {
    console.error(`[Events] Failed to fetch events for ${symbol}:`, error);
  }

  return events;
}

/**
 * Fetch macro events from config
 */
async function fetchMacroEvents(): Promise<MacroEvent[]> {
  const today = new Date();
  const lookaheadDays = 30;
  const to = new Date(today.getTime() + lookaheadDays * 24 * 60 * 60 * 1000);

  // Use local date instead of UTC to avoid timezone issues
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(to.getDate()).padStart(2, "0")}`;

  const config: MacroEvent[] = [
    {
      type: "fomc",
      title: "FOMC Meeting",
      date: "2025-12-17",
      description: "Federal Reserve interest rate decision",
    },
    {
      type: "cpi",
      title: "CPI Report",
      date: "2025-12-12",
      description: "Consumer Price Index data release",
    },
    {
      type: "jobs",
      title: "Jobs Report",
      date: "2025-12-05",
      description: "Non-farm payrolls data",
    },
  ];

  return config.filter((e) => e.date >= todayStr && e.date <= toStr);
}

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

    cleanExpiredEvents();

    // Fetch stock events (check cache per ticker)
    const stockEvents: StockEvent[] = [];
    const symbolsToFetch: string[] = [];

    for (const symbol of symbols) {
      const cached = getTickerEventsFromCache(symbol);
      if (cached) {
        console.log(`[Events] Cache hit for ${symbol}`);
        stockEvents.push(...cached.stockEvents);
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    // Fetch uncached tickers
    if (symbolsToFetch.length > 0) {
      console.log(`[Events] Fetching events for: ${symbolsToFetch.join(", ")}`);

      const fetchPromises = symbolsToFetch.map(async (symbol) => {
        const events = await fetchTickerEvents(symbol);
        setTickerEventsInCache(symbol, {
          stockEvents: events,
          fetchedAt: Date.now(),
        });
        return events;
      });

      const results = await Promise.all(fetchPromises);
      stockEvents.push(...results.flat());
    }

    // Fetch macro events (cached separately)
    let macroEvents = getMacroEventsFromCache();
    if (!macroEvents) {
      console.log("[Events] Fetching macro events");
      macroEvents = await fetchMacroEvents();
      setMacroEventsInCache(macroEvents);
    } else {
      console.log("[Events] Using cached macro events");
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
  } catch (error) {
    console.error("[Events] Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
