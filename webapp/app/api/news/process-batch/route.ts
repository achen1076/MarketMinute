import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shouldSummarize, summarizeArticle } from "@shared/lib/articleSummarizer";

/**
 * Batch news processing endpoint for Lambda
 * POST /api/news/process-batch
 *
 * Body: { tickers: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const { tickers, from, to } = await req.json();

    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json(
        { error: "tickers array is required" },
        { status: 400 }
      );
    }

    const sentimentUrl = process.env.SENTIMENT_SERVICE_URL;
    const relevanceUrl = process.env.RELEVANCE_SERVICE_URL;
    const fmpApiKey = process.env.FMP_API_KEY;

    if (!sentimentUrl || !relevanceUrl || !fmpApiKey) {
      return NextResponse.json(
        { error: "ML services or FMP API not configured" },
        { status: 500 }
      );
    }

    let totalProcessed = 0;
    let totalSaved = 0;

    for (const ticker of tickers) {
      try {
        console.log(`Processing ${ticker}...`);

        let fmpUrl = `https://financialmodelingprep.com/stable/news/stock?symbols=${ticker}&apikey=${fmpApiKey}`;
        if (from) fmpUrl += `&from=${from}`;
        if (to) fmpUrl += `&to=${to}`;

        const fmpResp = await fetch(fmpUrl);

        if (!fmpResp.ok) {
          console.warn(`  Failed to fetch news for ${ticker}`);
          continue;
        }

        const newsData = await fmpResp.json();

        if (!newsData || newsData.length === 0) {
          console.log(`  - No news found`);
          continue;
        }

        let tickerSaved = 0;

        for (const item of newsData.slice(0, 20)) {
          const headline = item.title;
          const articleUrl = item.url;
          const publishedDate = item.publishedDate;
          if (!headline) continue;

          const [sentResp, relResp] = await Promise.all([
            fetch(`${sentimentUrl}/score`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: headline }),
            }),
            fetch(`${relevanceUrl}/score`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ headline, ticker }),
            }),
          ]);

          if (!sentResp.ok || !relResp.ok) continue;

          const sentimentData = (await sentResp.json()) as {
            score: number;
            category: string;
          };
          const relevanceData = (await relResp.json()) as {
            score: number;
            category: string;
          };

          // Generate AI summary for highly relevant articles with strong sentiment
          let summary: string | null = null;
          if (
            articleUrl &&
            shouldSummarize(relevanceData.score, sentimentData.score)
          ) {
            console.log(
              `  🤖 Summarizing highly relevant article for ${ticker}...`
            );
            summary = await summarizeArticle(articleUrl, headline, ticker);
          }

          // Save to database
          await prisma.newsItem.create({
            data: {
              ticker,
              headline,
              sentiment: sentimentData.score,
              relevance: relevanceData.score,
              category: relevanceData.category,
              summary,
              url: articleUrl,
              createdAt: publishedDate ? new Date(publishedDate) : new Date(),
            },
          });

          totalSaved++;
          tickerSaved++;
        }

        console.log(`  ✓ ${ticker} complete - saved ${tickerSaved} items`);
        totalProcessed++;
      } catch (error) {
        console.error(`  ✗ Error processing ${ticker}:`, error);
        continue;
      }
    }

    console.log(
      `\nBatch complete: ${totalProcessed} tickers processed, ${totalSaved} news items saved`
    );

    return NextResponse.json({
      ok: true,
      processed: totalProcessed,
      saved: totalSaved,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Batch news processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
