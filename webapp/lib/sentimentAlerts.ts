import "server-only";
import { prisma } from "@/lib/prisma";

type SentimentCategory =
  | "very_negative"
  | "negative"
  | "neutral"
  | "positive"
  | "very_positive";

interface SentimentShift {
  symbol: string;
  previousSentiment: number;
  currentSentiment: number;
  previousCategory: SentimentCategory;
  currentCategory: SentimentCategory;
  shiftType: "bearish_to_bullish" | "bullish_to_bearish" | "neutral_to_extreme";
}

/**
 * Categorize sentiment score into buckets
 */
function categorizeSentiment(score: number): SentimentCategory {
  if (score <= -0.4) return "very_negative";
  if (score <= -0.15) return "negative";
  if (score <= 0.15) return "neutral";
  if (score <= 0.4) return "positive";
  return "very_positive";
}

/**
 * Get severity based on shift magnitude
 */
function getShiftSeverity(
  shift: SentimentShift
): "info" | "warning" | "critical" {
  const magnitude = Math.abs(shift.currentSentiment - shift.previousSentiment);
  if (magnitude >= 0.6) return "critical";
  if (magnitude >= 0.4) return "warning";
  return "info";
}

/**
 * Generate alert title and message for sentiment shift
 */
function generateAlertContent(shift: SentimentShift): {
  title: string;
  message: string;
} {
  const symbol = shift.symbol;

  if (shift.shiftType === "bearish_to_bullish") {
    return {
      title: `${symbol}: Sentiment Turning Bullish`,
      message: `News sentiment for ${symbol} has shifted from ${shift.previousCategory.replace(
        "_",
        " "
      )} to ${shift.currentCategory.replace(
        "_",
        " "
      )}. This could indicate improving market perception.`,
    };
  }

  if (shift.shiftType === "bullish_to_bearish") {
    return {
      title: `${symbol}: Sentiment Turning Bearish`,
      message: `News sentiment for ${symbol} has shifted from ${shift.previousCategory.replace(
        "_",
        " "
      )} to ${shift.currentCategory.replace(
        "_",
        " "
      )}. This could indicate deteriorating market perception.`,
    };
  }

  // neutral_to_extreme
  if (shift.currentSentiment > 0) {
    return {
      title: `${symbol}: Strong Bullish Sentiment`,
      message: `News sentiment for ${symbol} has surged from neutral to ${shift.currentCategory.replace(
        "_",
        " "
      )}. Significant positive news may be driving this change.`,
    };
  } else {
    return {
      title: `${symbol}: Strong Bearish Sentiment`,
      message: `News sentiment for ${symbol} has dropped from neutral to ${shift.currentCategory.replace(
        "_",
        " "
      )}. Significant negative news may be driving this change.`,
    };
  }
}

/**
 * Detect if there's a significant sentiment shift
 */
function detectShift(
  symbol: string,
  previousSentiment: number,
  currentSentiment: number
): SentimentShift | null {
  const prevCategory = categorizeSentiment(previousSentiment);
  const currCategory = categorizeSentiment(currentSentiment);

  if (prevCategory === currCategory) return null;

  const change = currentSentiment - previousSentiment;
  if (Math.abs(change) < 0.5) return null;

  let shiftType: SentimentShift["shiftType"] | null = null;

  if (
    (prevCategory === "negative" || prevCategory === "very_negative") &&
    (currCategory === "positive" || currCategory === "very_positive")
  ) {
    shiftType = "bearish_to_bullish";
  }

  if (
    (prevCategory === "positive" || prevCategory === "very_positive") &&
    (currCategory === "negative" || currCategory === "very_negative")
  ) {
    shiftType = "bullish_to_bearish";
  }

  // Neutral to Extreme: neutral -> very_positive/very_negative
  if (
    prevCategory === "neutral" &&
    (currCategory === "very_positive" || currCategory === "very_negative")
  ) {
    shiftType = "neutral_to_extreme";
  }

  if (!shiftType) return null;

  return {
    symbol,
    previousSentiment,
    currentSentiment,
    previousCategory: prevCategory,
    currentCategory: currCategory,
    shiftType,
  };
}

/**
 * Store today's sentiment for a symbol
 */
export async function storeDailySentiment(
  symbol: string,
  sentiment: number,
  newsCount: number
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.sentimentHistory.upsert({
    where: {
      symbol_date: {
        symbol: symbol.toUpperCase(),
        date: today,
      },
    },
    update: {
      sentiment,
      newsCount,
    },
    create: {
      symbol: symbol.toUpperCase(),
      date: today,
      sentiment,
      newsCount,
    },
  });
}

/**
 * Get previous day's sentiment for a symbol
 */
export async function getPreviousSentiment(
  symbol: string
): Promise<number | null> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const record = await prisma.sentimentHistory.findUnique({
    where: {
      symbol_date: {
        symbol: symbol.toUpperCase(),
        date: yesterday,
      },
    },
  });

  return record?.sentiment ?? null;
}

/**
 * Check for sentiment shifts and create a TickerAlert for the symbol
 */
export async function checkAndCreateSentimentAlerts(
  symbol: string,
  currentSentiment: number,
  newsCount: number
): Promise<boolean> {
  // Store today's sentiment
  await storeDailySentiment(symbol, currentSentiment, newsCount);

  // Get previous sentiment
  const previousSentiment = await getPreviousSentiment(symbol);
  if (previousSentiment === null) {
    console.log(
      `[SentimentAlerts] No previous sentiment for ${symbol}, skipping`
    );
    return false;
  }

  // Detect shift
  const shift = detectShift(symbol, previousSentiment, currentSentiment);
  if (!shift) {
    return false;
  }

  console.log(
    `[SentimentAlerts] Detected shift for ${symbol}: ${shift.shiftType}`
  );

  const { title, message } = generateAlertContent(shift);
  const severity = getShiftSeverity(shift);

  // Create a TickerAlert for this symbol (expires after 24 hours)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await prisma.tickerAlert.create({
    data: {
      symbol: symbol.toUpperCase(),
      type: "sentiment_shift",
      title,
      message,
      severity,
      expiresAt,
      metadata: {
        previousSentiment: shift.previousSentiment,
        currentSentiment: shift.currentSentiment,
        previousCategory: shift.previousCategory,
        currentCategory: shift.currentCategory,
        shiftType: shift.shiftType,
      },
    },
  });

  console.log(`[SentimentAlerts] Created ticker alert for ${symbol}`);
  return true;
}

/**
 * Process sentiment alerts for multiple symbols (batch operation)
 */
export async function processSentimentAlertsForSymbols(
  symbolSentiments: Array<{
    symbol: string;
    sentiment: number;
    newsCount: number;
  }>
): Promise<{ processed: number; alertsCreated: number }> {
  let totalAlerts = 0;

  for (const { symbol, sentiment, newsCount } of symbolSentiments) {
    try {
      const created = await checkAndCreateSentimentAlerts(
        symbol,
        sentiment,
        newsCount
      );
      if (created) totalAlerts++;
    } catch (error) {
      console.error(`[SentimentAlerts] Error processing ${symbol}:`, error);
    }
  }

  return {
    processed: symbolSentiments.length,
    alertsCreated: totalAlerts,
  };
}

/**
 * Get active alerts for symbols in a watchlist
 */
export async function getAlertsForWatchlist(watchlistId: string): Promise<
  Array<{
    id: string;
    symbol: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    metadata: unknown;
    createdAt: Date;
  }>
> {
  // Get all symbols in the watchlist
  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { watchlistId },
    select: { symbol: true },
  });

  const symbols = watchlistItems.map((item) => item.symbol.toUpperCase());

  if (symbols.length === 0) return [];

  // Get active (non-expired) alerts for these symbols
  const now = new Date();
  const alerts = await prisma.tickerAlert.findMany({
    where: {
      symbol: { in: symbols },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });

  return alerts;
}

/**
 * Get active alerts for a specific symbol
 */
export async function getAlertsForSymbol(symbol: string): Promise<
  Array<{
    id: string;
    symbol: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    metadata: unknown;
    createdAt: Date;
  }>
> {
  const now = new Date();
  const alerts = await prisma.tickerAlert.findMany({
    where: {
      symbol: symbol.toUpperCase(),
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });

  return alerts;
}
