"""
Auto-label sentiment scores using GPT + relative performance
Combines GPT-4's headline analysis with actual stock/index movements
"""

import os
import pandas as pd
import numpy as np
from tqdm import tqdm
from openai import AsyncOpenAI
import asyncio
import time

# Initialize OpenAI async client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def gpt_tone_score(headline, ticker, stock_change, dow, sp, nasdaq, retries=3):
    """
    Use GPT to analyze headline sentiment (async)
    Returns score between -1 (very negative) and 1 (very positive)
    """
    for attempt in range(retries):
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a financial sentiment classifier. "
                        "Rate the sentiment of the headline strictly between -1 and 1 be less rigid, use any number not just ending in 5 or 0."
                        "where -1 is extremely negative for the stock and 1 is extremely positive. "
                        "you are judging based on how much the specific stock would move if this news were to be released."
                        "be tigher on your rating, accuracy is most important."
                        "you are given the stock movement along with the 3 major indicies of the stocks on that given day"
                        "Consider: earnings surprises, product launches, legal issues, management changes, etc. "
                        "Only return the number with no explanation."
                    )
                },
                {"role": "user", "content": "headline: " +
                    headline + "\nticker: " + ticker + "\nstock: " + str(stock_change) + "%\ndow: " + str(dow) + "%\nsp: " + str(sp) + "%\nnasdaq: " + str(nasdaq) + "%"}
            ]

            response = await client.responses.create(
                model="gpt-5-mini",
                input=messages,
                reasoning={"effort": "low"},
                text={"verbosity": "low"}
            )

            score = float(response.output_text.strip())
            return np.clip(score, -1, 1)
        except Exception as e:
            if attempt < retries - 1:
                await asyncio.sleep(1)
            else:
                return 0.0


def compute_relative_score(stock, dow, sp, nasdaq):
    """
    Calculate relative performance vs market indices
    Positive = stock outperformed market
    Negative = stock underperformed market
    """
    market_avg = (dow + sp + nasdaq) / 3
    rel = stock - market_avg
    # Normalize: ±4% relative movement = ±1 sentiment
    rel_score = np.clip(rel / 4.0, -1, 1)
    return rel_score


async def label_ticker_news(input_file="../data/ticker_news_training_unlabeled.csv",
                            output_file="../data/ticker_news_training_labeled.csv"):
    """
    Label ticker-specific news with sentiment scores
    Combines GPT headline analysis (80%) + relative performance (20%)
    """
    print("=" * 60)
    print("📰 Labeling Ticker News")
    print("=" * 60)

    df = pd.read_csv(input_file)
    print(f"Loaded {len(df)} records from {input_file}")
    print("Processing in parallel batches...")

    gpt_scores = []
    rel_scores = []
    final_sentiments = []

    # Process in batches of 50 for parallel requests
    batch_size = 50
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]

        # Get GPT scores for all headlines in parallel
        tasks = [gpt_tone_score(row["headline"], row["ticker"], row["stockChangePct"], row["dowChangePct"], row["spChangePct"], row["nasdaqChangePct"])
                 for _, row in batch.iterrows()]
        tones = await asyncio.gather(*tasks)

        # Calculate sentiments for batch
        for (_, row), tone in zip(batch.iterrows(), tones):
            rel_score = compute_relative_score(
                row["stockChangePct"],
                row["dowChangePct"],
                row["spChangePct"],
                row["nasdaqChangePct"]
            )

            sentiment = 0.8 * tone + 0.2 * rel_score

            gpt_scores.append(tone)
            rel_scores.append(rel_score)
            final_sentiments.append(np.clip(sentiment, -1, 1))

        print(f"  Processed {min(i+batch_size, len(df))}/{len(df)} records...")

    df["gpt_sentiment"] = gpt_scores
    df["relative_performance"] = rel_scores
    df["final_sentiment"] = final_sentiments
    df.to_csv(output_file, index=False)

    print(f"\n✅ Saved labeled file to {output_file}")
    print(
        f"   GPT sentiment range: [{df['gpt_sentiment'].min():.2f}, {df['gpt_sentiment'].max():.2f}]")
    print(
        f"   Final sentiment range: [{df['final_sentiment'].min():.2f}, {df['final_sentiment'].max():.2f}]")
    print(f"   Mean final sentiment: {df['final_sentiment'].mean():.2f}")

    return df


async def label_general_news(input_file="../data/general_news_training_unlabeled.csv",
                             output_file="../data/general_news_training_labeled.csv"):
    """
    Label general market news with sentiment scores
    Uses GPT headline analysis (90%) + market direction (10%)
    """
    print("\n" + "=" * 60)
    print("🌍 Labeling General News")
    print("=" * 60)

    df = pd.read_csv(input_file)
    print(f"Loaded {len(df)} records from {input_file}")
    print("Processing in parallel...")

    gpt_scores = []
    market_scores = []
    final_sentiments = []

    # Process all at once since it's only ~100 records
    tasks = [gpt_tone_score_general(row["headline"], row["dowChangePct"], row["spChangePct"], row["nasdaqChangePct"])
             for _, row in df.iterrows()]
    tones = await asyncio.gather(*tasks)

    for (_, row), tone in zip(df.iterrows(), tones):
        market_avg = (row["dowChangePct"] +
                      row["spChangePct"] + row["nasdaqChangePct"]) / 3
        market_score = np.clip(market_avg / 2.0, -1, 1)

        sentiment = 0.9 * tone + 0.1 * market_score

        gpt_scores.append(tone)
        market_scores.append(market_score)
        final_sentiments.append(np.clip(sentiment, -1, 1))

    df["gpt_sentiment"] = gpt_scores
    df["market_direction"] = market_scores
    df["final_sentiment"] = final_sentiments
    df.to_csv(output_file, index=False)

    print(f"\n✅ Saved labeled file to {output_file}")
    print(
        f"   GPT sentiment range: [{df['gpt_sentiment'].min():.2f}, {df['gpt_sentiment'].max():.2f}]")
    print(
        f"   Final sentiment range: [{df['final_sentiment'].min():.2f}, {df['final_sentiment'].max():.2f}]")
    print(f"   Mean final sentiment: {df['final_sentiment'].mean():.2f}")

    return df


async def main_async():
    """
    Main async entry point - label both ticker and general news
    """
    print("🤖 Auto-Labeling Sentiment with GPT-5-mini")
    print("=" * 60)

    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("   Set it with: export OPENAI_API_KEY='your-key'")
        return

    # Label ticker news
    try:
        await label_ticker_news()
    except FileNotFoundError:
        print("⚠️  Ticker news file not found, skipping...")
    except Exception as e:
        print(f"❌ Error labeling ticker news: {e}")
        import traceback
        traceback.print_exc()

    # Label general news
    try:
        await label_general_news()
    except FileNotFoundError:
        print("⚠️  General news file not found, skipping...")
    except Exception as e:
        print(f"❌ Error labeling general news: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("✅ Sentiment labeling complete!")
    print("=" * 60)
    print("\n📝 Next Steps:")
    print("1. Review the labeled files for quality")
    print("2. Manually adjust any scores that seem off")
    print("3. Use the labeled data for model training")


def main():
    """Wrapper to run async main"""
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
