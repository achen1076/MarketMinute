import "server-only";

export type MacroNewsItem = {
  title: string;
  summary: string;
  source: string;
  publishedAt: string; // ISO
  category: "rates" | "inflation" | "employment" | "gdp" | "policy" | "geopolitical" | "other";
  impact: "high" | "medium" | "low";
};

/**
 * Fetch macro economic news from Finnhub
 * Categories: forex, crypto, merger, general (we focus on general for macro)
 */
export async function getMacroNews(maxItems = 10): Promise<MacroNewsItem[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn("FINNHUB_API_KEY not set, skipping macro news fetch.");
    return [];
  }

  const url = new URL("https://finnhub.io/api/v1/news");
  url.searchParams.set("category", "general");
  url.searchParams.set("token", apiKey);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 600 }, // 10 minutes
    });

    if (!res.ok) {
      console.error("Macro news fetch error:", res.status);
      return [];
    }

    const data = (await res.json()) as any[];

    // Filter for macro-relevant keywords and categorize
    const macroNews = data
      .filter((item) => isMacroRelevant(item.headline || item.title || ""))
      .slice(0, maxItems)
      .map((item) => {
        const title = item.headline || item.title || "";
        return {
          title,
          summary: item.summary || title,
          source: item.source || "Unknown",
          publishedAt: item.datetime
            ? new Date(item.datetime * 1000).toISOString()
            : new Date().toISOString(),
          category: categorizeMacroNews(title),
          impact: assessImpact(title),
        };
      });

    return macroNews;
  } catch (error) {
    console.error("Error fetching macro news:", error);
    return [];
  }
}

/**
 * Check if headline is macro-relevant
 */
function isMacroRelevant(headline: string): boolean {
  const lower = headline.toLowerCase();
  
  const macroKeywords = [
    // Central banks & rates
    "federal reserve", "fed", "fomc", "interest rate", "rate cut", "rate hike",
    "powell", "yellen", "ecb", "boe", "bank of japan", "central bank",
    
    // Economic indicators
    "inflation", "cpi", "pce", "consumer price", "producer price", "ppi",
    "jobs report", "unemployment", "payroll", "jobless claims",
    "gdp", "economic growth", "recession",
    
    // Treasury & fiscal
    "treasury", "bonds", "yields", "debt ceiling", "fiscal",
    
    // Trade & geopolitical
    "trade war", "tariff", "sanctions", "china", "russia", "ukraine",
    "oil prices", "crude", "opec",
    
    // Market-wide
    "market outlook", "economic outlook", "dow", "s&p 500", "nasdaq",
  ];

  return macroKeywords.some((keyword) => lower.includes(keyword));
}

/**
 * Categorize macro news by topic
 */
function categorizeMacroNews(headline: string): MacroNewsItem["category"] {
  const lower = headline.toLowerCase();

  if (
    lower.includes("fed") ||
    lower.includes("federal reserve") ||
    lower.includes("interest rate") ||
    lower.includes("rate cut") ||
    lower.includes("rate hike") ||
    lower.includes("powell") ||
    lower.includes("central bank")
  ) {
    return "rates";
  }

  if (
    lower.includes("inflation") ||
    lower.includes("cpi") ||
    lower.includes("pce") ||
    lower.includes("consumer price")
  ) {
    return "inflation";
  }

  if (
    lower.includes("jobs") ||
    lower.includes("unemployment") ||
    lower.includes("payroll") ||
    lower.includes("jobless")
  ) {
    return "employment";
  }

  if (lower.includes("gdp") || lower.includes("economic growth")) {
    return "gdp";
  }

  if (
    lower.includes("trade") ||
    lower.includes("tariff") ||
    lower.includes("sanctions") ||
    lower.includes("china") ||
    lower.includes("russia") ||
    lower.includes("ukraine")
  ) {
    return "geopolitical";
  }

  if (
    lower.includes("treasury") ||
    lower.includes("fiscal") ||
    lower.includes("debt ceiling")
  ) {
    return "policy";
  }

  return "other";
}

/**
 * Assess potential market impact
 */
function assessImpact(headline: string): MacroNewsItem["impact"] {
  const lower = headline.toLowerCase();

  // High impact keywords
  const highImpact = [
    "fed", "federal reserve", "interest rate decision", "fomc",
    "jobs report", "unemployment", "inflation",
    "recession", "crisis", "emergency",
    "rate cut", "rate hike",
  ];

  // Medium impact keywords
  const mediumImpact = [
    "treasury", "bonds", "yields",
    "trade", "tariff",
    "oil prices", "crude",
  ];

  if (highImpact.some((keyword) => lower.includes(keyword))) {
    return "high";
  }

  if (mediumImpact.some((keyword) => lower.includes(keyword))) {
    return "medium";
  }

  return "low";
}
