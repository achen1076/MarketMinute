// ============================================
// EXPECTATION GAP CLASSIFIER
// The heart of the engine - classifies why stocks move
// Uses ML-powered sentiment and relevance scoring
// ============================================

import type {
  PriceMove,
  ExpectationBaseline,
  ExpectationGap,
  MoveClassification,
} from "../types";
import { getExpectedMove } from "./expectation-baseline";

// ML Service URLs (configured via environment)
const SENTIMENT_SERVICE_URL =
  process.env.SENTIMENT_SERVICE_URL || "http://localhost:8001";
const RELEVANCE_SERVICE_URL =
  process.env.RELEVANCE_SERVICE_URL || "http://localhost:8002";

interface NewsItem {
  title: string;
  sentiment: number; // -1 to 1
  relevance: number; // 0 to 1
  isFundamental: boolean;
  source: string;
  publishedAt: string;
}

interface SentimentResponse {
  score: number;
  category: string;
}

interface RelevanceResponse {
  score: number;
  category: string;
}

/**
 * Score sentiment using ML service
 */
async function scoreSentiment(text: string): Promise<number> {
  try {
    const res = await fetch(`${SENTIMENT_SERVICE_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      console.warn(`[GapClassifier] Sentiment service failed: ${res.status}`);
      return 0;
    }

    const data: SentimentResponse = await res.json();
    return data.score;
  } catch (error) {
    console.warn(`[GapClassifier] Sentiment service unavailable:`, error);
    return 0;
  }
}

/**
 * Score sentiment for multiple texts in batch
 */
async function scoreSentimentBatch(texts: string[]): Promise<number[]> {
  if (texts.length === 0) return [];

  try {
    const res = await fetch(`${SENTIMENT_SERVICE_URL}/score/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });

    if (!res.ok) {
      console.warn(
        `[GapClassifier] Sentiment batch service failed: ${res.status}`
      );
      return texts.map(() => 0);
    }

    const data: { scores: number[]; categories: string[] } = await res.json();
    return data.scores;
  } catch (error) {
    console.warn(`[GapClassifier] Sentiment batch service unavailable:`, error);
    return texts.map(() => 0);
  }
}

/**
 * Score relevance using ML service
 */
async function scoreRelevance(
  headline: string,
  ticker: string
): Promise<number> {
  try {
    const res = await fetch(`${RELEVANCE_SERVICE_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline, ticker }),
    });

    if (!res.ok) {
      console.warn(`[GapClassifier] Relevance service failed: ${res.status}`);
      return 0;
    }

    const data: RelevanceResponse = await res.json();
    return data.score;
  } catch (error) {
    console.warn(`[GapClassifier] Relevance service unavailable:`, error);
    return 0;
  }
}

/**
 * Fetch recent news for a symbol with ML-powered scoring
 */
async function fetchRecentNews(symbol: string): Promise<NewsItem[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/news/stock?symbols=${symbol}&limit=20&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.log(
        `[GapClassifier] News API failed for ${symbol}: ${res.status}`
      );
      return [];
    }

    const news = await res.json();
    if (!news || !Array.isArray(news)) return [];

    // Extract headlines for batch processing
    interface RawNewsItem {
      title: string;
      source: string;
      publishedAt: string;
      relevance?: number;
    }

    const rawItems: RawNewsItem[] = news
      .slice(0, 15)
      .map((item: { title: string; site: string; publishedDate: string }) => ({
        title: item.title,
        source: item.site,
        publishedAt: item.publishedDate,
      }));

    if (rawItems.length === 0) return [];

    // Score relevance for each headline (in parallel)
    const relevancePromises = rawItems.map((item) =>
      scoreRelevance(item.title, symbol)
    );
    const relevanceScores = await Promise.all(relevancePromises);

    // Filter to only relevant news (score > 0.5)
    const relevantItems: RawNewsItem[] = [];
    const relevantTitles: string[] = [];

    rawItems.forEach((item, i) => {
      if (relevanceScores[i] >= 0.5) {
        relevantItems.push({ ...item, relevance: relevanceScores[i] });
        relevantTitles.push(item.title);
      }
    });

    console.log(
      `[GapClassifier] ML relevance filtered ${relevantItems.length}/${rawItems.length} news for ${symbol}`
    );

    if (relevantItems.length === 0) return [];

    // Score sentiment in batch for efficiency
    const sentimentScores = await scoreSentimentBatch(relevantTitles);

    // Build final news items with ML scores
    return relevantItems.slice(0, 10).map((item, i) => {
      const title = item.title.toLowerCase();

      // Detect if news is fundamental (keyword-based, could also be ML later)
      const fundamentalKeywords = [
        "earnings",
        "revenue",
        "eps",
        "guidance",
        "forecast",
        "merger",
        "acquisition",
        "fda",
        "sec",
        "ceo",
        "dividend",
        "buyback",
        "restructuring",
        "profit",
        "loss",
        "beat",
        "miss",
      ];
      const isFundamental = fundamentalKeywords.some((kw) =>
        title.includes(kw)
      );

      return {
        title: item.title,
        sentiment: sentimentScores[i] ?? 0,
        relevance: item.relevance ?? 0,
        isFundamental,
        source: item.source,
        publishedAt: item.publishedAt,
      };
    });
  } catch (error) {
    console.error(`[GapClassifier] Error fetching news:`, error);
    return [];
  }
}

/**
 * Calculate aggregate news sentiment
 */
function calculateNewsSentiment(news: NewsItem[]): {
  sentiment: number;
  hasFundamentalNews: boolean;
  fundamentalDelta: string | undefined;
} {
  if (news.length === 0) {
    return {
      sentiment: 0,
      hasFundamentalNews: false,
      fundamentalDelta: undefined,
    };
  }

  // Weight recent news more heavily
  let weightedSentiment = 0;
  let totalWeight = 0;
  let hasFundamentalNews = false;
  let fundamentalDelta: string | undefined;

  news.forEach((item, index) => {
    const weight = 1 / (index + 1); // Decay weight for older news
    weightedSentiment += item.sentiment * weight;
    totalWeight += weight;

    if (item.isFundamental) {
      hasFundamentalNews = true;
      if (!fundamentalDelta) {
        fundamentalDelta = item.title;
      }
    }
  });

  return {
    sentiment: totalWeight > 0 ? weightedSentiment / totalWeight : 0,
    hasFundamentalNews,
    fundamentalDelta,
  };
}

/**
 * Determine sentiment-price alignment
 */
function getSentimentAlignment(
  sentiment: number,
  priceChange: number
): "aligned" | "divergent" | "neutral" {
  const sentimentDirection = sentiment > 0.1 ? 1 : sentiment < -0.1 ? -1 : 0;
  const priceDirection = priceChange > 0.5 ? 1 : priceChange < -0.5 ? -1 : 0;

  if (sentimentDirection === 0 || priceDirection === 0) {
    return "neutral";
  }

  return sentimentDirection === priceDirection ? "aligned" : "divergent";
}

/**
 * Classify the move based on all available data
 */
function classifyMove(
  priceMove: PriceMove,
  baseline: ExpectationBaseline,
  newsSentiment: { sentiment: number; hasFundamentalNews: boolean },
  sectorCorrelation: number,
  moveGapRatio: number
): {
  classification: MoveClassification;
  confidence: number;
  evidence: string[];
} {
  const evidence: string[] = [];
  let classification: MoveClassification = "noise";
  let confidence = 0.5;

  const absMove = Math.abs(priceMove.changePct);
  const expectedMove = getExpectedMove(baseline);
  const isLargeMove = absMove > expectedMove * 1.5;
  const isSmallMove = absMove < expectedMove * 0.7;

  // FUNDAMENTAL: Strong move + fundamental news
  if (newsSentiment.hasFundamentalNews && isLargeMove) {
    classification = "fundamental";
    confidence = 0.85;
    evidence.push("Fundamental news detected (earnings, guidance, M&A, etc.)");
    evidence.push(
      `Move of ${absMove.toFixed(1)}% exceeds expected ${expectedMove.toFixed(
        1
      )}%`
    );

    // Check if sentiment aligns with move
    const alignment = getSentimentAlignment(
      newsSentiment.sentiment,
      priceMove.changePct
    );
    if (alignment === "aligned") {
      confidence = 0.9;
      evidence.push("News sentiment aligns with price direction");
    } else if (alignment === "divergent") {
      confidence = 0.7;
      evidence.push("⚠️ Price diverging from news sentiment");
    }

    return { classification, confidence, evidence };
  }

  // MACRO: High sector correlation
  if (sectorCorrelation > 0.7 && !newsSentiment.hasFundamentalNews) {
    classification = "macro";
    confidence = 0.75;
    evidence.push(
      `High sector correlation (${(sectorCorrelation * 100).toFixed(0)}%)`
    );
    evidence.push("No stock-specific fundamental news");

    if (priceMove.volumeRatio < 1.2) {
      confidence = 0.8;
      evidence.push("Normal volume suggests passive/index flows");
    }

    return { classification, confidence, evidence };
  }

  // POSITIONING: Volume spike without news
  if (priceMove.volumeRatio > 2 && !newsSentiment.hasFundamentalNews) {
    classification = "positioning";
    confidence = 0.7;
    evidence.push(`Volume spike: ${priceMove.volumeRatio.toFixed(1)}x average`);
    evidence.push("No fundamental news catalyst");

    if (sectorCorrelation > 0.5) {
      evidence.push("Likely sector de-risking or rebalancing");
      confidence = 0.75;
    } else {
      evidence.push("Possible institutional positioning change");
    }

    return { classification, confidence, evidence };
  }

  // NARRATIVE: News without fundamentals
  if (
    Math.abs(newsSentiment.sentiment) > 0.3 &&
    !newsSentiment.hasFundamentalNews
  ) {
    classification = "narrative";
    confidence = 0.65;
    evidence.push("Non-fundamental news driving sentiment");
    evidence.push(
      `News sentiment: ${newsSentiment.sentiment > 0 ? "positive" : "negative"}`
    );

    const alignment = getSentimentAlignment(
      newsSentiment.sentiment,
      priceMove.changePct
    );
    if (alignment === "aligned") {
      evidence.push("Market reacting to narrative, not fundamentals");
    } else if (alignment === "divergent") {
      confidence = 0.5;
      evidence.push("⚠️ Price diverging from narrative - potential reversal");
    }

    return { classification, confidence, evidence };
  }

  // NOISE: Small move, no clear catalyst
  if (isSmallMove && !newsSentiment.hasFundamentalNews) {
    classification = "noise";
    confidence = 0.6;
    evidence.push(`Move of ${absMove.toFixed(1)}% within normal range`);
    evidence.push("No significant catalyst identified");
    evidence.push("Likely random walk / market microstructure");

    return { classification, confidence, evidence };
  }

  // Default: Analyze the gap ratio
  if (moveGapRatio > 2) {
    // Move is much larger than expected
    classification = "positioning";
    confidence = 0.55;
    evidence.push(`Move ${moveGapRatio.toFixed(1)}x larger than expected`);
    evidence.push("Possible hidden catalyst or positioning");
  } else if (moveGapRatio < 0.5) {
    // Move is much smaller than expected
    classification = "noise";
    confidence = 0.5;
    evidence.push("Move smaller than typical, low conviction");
  } else {
    classification = "noise";
    confidence = 0.4;
    evidence.push("Unable to determine clear catalyst");
  }

  return { classification, confidence, evidence };
}

/**
 * Build the complete expectation gap analysis
 */
export async function analyzeExpectationGap(
  priceMove: PriceMove,
  baseline: ExpectationBaseline,
  sectorMove: number = 0
): Promise<ExpectationGap> {
  // Fetch news and analyze sentiment
  const news = await fetchRecentNews(priceMove.symbol);
  const { sentiment, hasFundamentalNews, fundamentalDelta } =
    calculateNewsSentiment(news);

  // Calculate move gap
  const expectedMove = getExpectedMove(baseline);
  const actualMove = priceMove.changePct;
  const moveGap = actualMove - (actualMove > 0 ? expectedMove : -expectedMove);
  const moveGapRatio =
    expectedMove !== 0 ? Math.abs(actualMove) / expectedMove : 1;

  // Calculate sector correlation (simplified - direction match)
  const sectorCorrelation =
    Math.sign(priceMove.changePct) === Math.sign(sectorMove)
      ? Math.min(
          Math.abs(priceMove.changePct / (sectorMove || 1)),
          Math.abs(sectorMove / (priceMove.changePct || 1))
        )
      : 0;

  // Classify the move
  const { classification, confidence, evidence } = classifyMove(
    priceMove,
    baseline,
    { sentiment, hasFundamentalNews },
    sectorCorrelation,
    moveGapRatio
  );

  const sentimentAlignment = getSentimentAlignment(
    sentiment,
    priceMove.changePct
  );

  return {
    actualMove,
    expectedMove,
    moveGap,
    moveGapRatio,
    newsSentiment: sentiment,
    sentimentMoveAlignment: sentimentAlignment,
    fundamentalNews: hasFundamentalNews,
    fundamentalDelta,
    classification,
    classificationConfidence: confidence,
    evidencePoints: evidence,
  };
}
