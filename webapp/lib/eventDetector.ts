import "server-only";
import { getNewsForSymbol, type NewsItem } from "./news";
import { StockEvent } from "./eventsCache";

/**
 * Detect events from news headlines and summaries
 * This helps catch events that might not be in structured APIs
 */
export async function detectEventsFromNews(
  symbol: string
): Promise<StockEvent[]> {
  const news = await getNewsForSymbol(symbol, 10);
  const events: StockEvent[] = [];

  for (const item of news) {
    const detected = parseNewsForEvent(symbol, item);
    if (detected) {
      events.push(detected);
    }
  }

  // Deduplicate by title and date
  const uniqueEvents = deduplicateEvents(events);
  return uniqueEvents;
}

/**
 * Parse a single news item for potential events
 */
function parseNewsForEvent(
  symbol: string,
  news: NewsItem
): StockEvent | null {
  const title = news.title.toLowerCase();
  const summary = (news.summary || "").toLowerCase();
  const text = `${title} ${summary}`;

  // Skip earnings detection - FMP API is more accurate
  // const earningsMatch = detectEarnings(text);
  // if (earningsMatch) {
  //   return {
  //     symbol: symbol.toUpperCase(),
  //     type: "earnings",
  //     title: `${symbol.toUpperCase()} Earnings ${earningsMatch.period}`,
  //     date: earningsMatch.date || estimateDateFromNews(news.publishedAt, 7),
  //     description: earningsMatch.description,
  //     source: "news" as const,
  //   };
  // }

  // Product launch detection
  const productMatch = detectProductLaunch(text);
  if (productMatch) {
    return {
      symbol: symbol.toUpperCase(),
      type: "other",
      title: `${symbol.toUpperCase()} Product Launch`,
      date: productMatch.date || estimateDateFromNews(news.publishedAt, 14),
      description: productMatch.description,
      source: "news" as const,
    };
  }

  // FDA approval / regulatory
  const fdaMatch = detectRegulatoryEvent(text);
  if (fdaMatch) {
    return {
      symbol: symbol.toUpperCase(),
      type: "other",
      title: `${symbol.toUpperCase()} Regulatory Event`,
      date: fdaMatch.date || estimateDateFromNews(news.publishedAt, 30),
      description: fdaMatch.description,
      source: "news" as const,
    };
  }

  // Conference / investor day
  const conferenceMatch = detectConference(text);
  if (conferenceMatch) {
    return {
      symbol: symbol.toUpperCase(),
      type: "conference",
      title: `${symbol.toUpperCase()} ${conferenceMatch.type}`,
      date: conferenceMatch.date || estimateDateFromNews(news.publishedAt, 21),
      description: conferenceMatch.description,
      source: "news" as const,
    };
  }

  // Skip dividend detection - FMP API is more accurate
  // const dividendMatch = detectDividend(text);
  // if (dividendMatch) {
  //   return {
  //     symbol: symbol.toUpperCase(),
  //     type: "dividend",
  //     title: `${symbol.toUpperCase()} Dividend`,
  //     date: dividendMatch.date || estimateDateFromNews(news.publishedAt, 30),
  //     description: dividendMatch.description,
  //     source: "news" as const,
  //   };
  // }

  return null;
}

/**
 * Detect earnings-related events
 */
function detectEarnings(text: string): {
  period: string;
  date?: string;
  description?: string;
} | null {
  const earningsKeywords = [
    "earnings report",
    "earnings call",
    "quarterly results",
    "q1 earnings",
    "q2 earnings",
    "q3 earnings",
    "q4 earnings",
    "reports earnings",
    "announces earnings",
  ];

  if (!earningsKeywords.some((kw) => text.includes(kw))) {
    return null;
  }

  // Try to extract quarter
  let period = "Upcoming";
  if (text.includes("q1") || text.includes("first quarter")) period = "Q1";
  if (text.includes("q2") || text.includes("second quarter")) period = "Q2";
  if (text.includes("q3") || text.includes("third quarter")) period = "Q3";
  if (text.includes("q4") || text.includes("fourth quarter")) period = "Q4";

  // Try to extract date (simple pattern matching)
  const date = extractDate(text);

  return {
    period,
    date,
    description: "Earnings report",
  };
}

/**
 * Detect product launches
 */
function detectProductLaunch(text: string): {
  date?: string;
  description?: string;
} | null {
  const productKeywords = [
    "product launch",
    "new product",
    "unveils",
    "announces new",
    "launches",
    "releasing",
    "to release",
    "will release",
  ];

  if (!productKeywords.some((kw) => text.includes(kw))) {
    return null;
  }

  const date = extractDate(text);

  return {
    date,
    description: "Product launch or announcement",
  };
}

/**
 * Detect FDA / regulatory events
 */
function detectRegulatoryEvent(text: string): {
  date?: string;
  description?: string;
} | null {
  const regulatoryKeywords = [
    "fda approval",
    "fda decision",
    "regulatory approval",
    "clinical trial",
    "trial results",
    "awaiting approval",
  ];

  if (!regulatoryKeywords.some((kw) => text.includes(kw))) {
    return null;
  }

  const date = extractDate(text);

  let description = "Regulatory event";
  if (text.includes("fda")) description = "FDA decision";
  if (text.includes("clinical trial")) description = "Clinical trial results";

  return {
    date,
    description,
  };
}

/**
 * Detect conferences and investor days
 */
function detectConference(text: string): {
  type: string;
  date?: string;
  description?: string;
} | null {
  const conferenceKeywords = [
    "investor day",
    "analyst day",
    "conference call",
    "shareholder meeting",
    "annual meeting",
  ];

  const matchedKeyword = conferenceKeywords.find((kw) => text.includes(kw));
  if (!matchedKeyword) {
    return null;
  }

  const date = extractDate(text);

  return {
    type: matchedKeyword
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    date,
    description: matchedKeyword,
  };
}

/**
 * Detect dividend announcements
 */
function detectDividend(text: string): {
  date?: string;
  description?: string;
} | null {
  const dividendKeywords = [
    "dividend",
    "declares dividend",
    "dividend payment",
    "ex-dividend",
  ];

  if (!dividendKeywords.some((kw) => text.includes(kw))) {
    return null;
  }

  const date = extractDate(text);

  let description = "Dividend payment";
  if (text.includes("increases dividend")) description = "Dividend increase";
  if (text.includes("ex-dividend")) description = "Ex-dividend date";

  return {
    date,
    description,
  };
}

/**
 * Extract date from text using simple patterns
 */
function extractDate(text: string): string | undefined {
  // Pattern: Month DD or Month DD, YYYY
  const monthDayPattern =
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i;
  const match = text.match(monthDayPattern);

  if (match) {
    const month = match[1].toLowerCase();
    const day = parseInt(match[2]);
    const monthNum = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ].indexOf(month);

    if (monthNum >= 0) {
      const year = new Date().getFullYear();
      const date = new Date(year, monthNum, day);

      // If the date is in the past, assume next year
      if (date < new Date()) {
        date.setFullYear(year + 1);
      }

      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    }
  }

  return undefined;
}

/**
 * Estimate a future date based on news publication date
 */
function estimateDateFromNews(
  publishedAt: string,
  daysAhead: number
): string {
  const date = new Date(publishedAt);
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Remove duplicate events
 */
function deduplicateEvents(events: StockEvent[]): StockEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.title}-${event.date}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
