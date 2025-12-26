"""
Auto-label relevance scores using GPT-5-mini
Scores how relevant each headline is to its associated ticker
"""

import os
import pandas as pd
import numpy as np
from tqdm import tqdm
from openai import AsyncOpenAI
import asyncio
from dotenv import load_dotenv

# Load .env file from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize OpenAI async client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def gpt_relevance_score(headline, ticker, retries=3):
    """
    Use GPT to analyze headline relevance to ticker (async)
    Returns score between 0.0 (not relevant) and 1.0 (highly relevant)
    """
    for attempt in range(retries):
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a financial news relevance classifier. "
                        "Your task is to rate how relevant a news headline is to a specific stock ticker "
                        "based on its **direct or material impact on that company specifically**, "
                        "not on the general market or sector.\n\n"

                        "IMPORTANT RULES:\n"
                        "- Do NOT score based on general market importance.\n"
                        "- Do NOT score high just because the headline involves technology, large companies, or negative/positive events.\n"
                        "- If the company is not mentioned explicitly, relevance must be justified by a clear, material second-order impact.\n"
                        "- If no such link is obvious, the score MUST be below 0.4.\n\n"

                        "Scoring guidelines:\n"
                        "- 0.90–1.00: Headline explicitly mentions the company, its ticker, or its core products, services, subsidiaries, or divisions.\n"
                        "- 0.70–0.89: Strong indirect relevance with a clear causal link (e.g., major competitor action, key supplier/customer event, regulatory action directly affecting the company).\n"
                        "- 0.50–0.69: Moderate relevance (industry-wide developments that reasonably affect the company’s fundamentals).\n"
                        "- 0.30–0.49: Weak or speculative relevance (broad sector news with limited or unclear impact).\n"
                        "- 0.00–0.29: Little to no relevance (news about other companies with no clear connection).\n\n"

                        "If the headline does NOT mention the company and you cannot clearly articulate a direct impact, "
                        "the score should generally be **below 0.30**.\n\n"

                        "Return ONLY a single decimal number between 0.0 and 1.0. "
                        "Use precise values (do not round to clean numbers)."
                    )
                },
                {"role": "user", "content": f"Headline: {headline}\nTicker: {ticker}"}
            ]

            response = await client.responses.create(
                model="gpt-5-mini",
                input=messages,
                reasoning={"effort": "low"},
                text={"verbosity": "low"}
            )

            score = float(response.output_text.strip())
            return np.clip(score, 0.0, 1.0)
        except Exception as e:
            if attempt < retries - 1:
                await asyncio.sleep(1)
            else:
                print(f"  ⚠️  Failed to score: {headline[:50]}... - {e}")
                return 0.5


async def label_ticker_news(input_file="data/ticker_news_training_unlabeled.csv",
                            output_file="data/ticker_news_training_labeled.csv",
                            checkpoint_file="data/relevance_checkpoint.csv"):
    """
    Label ticker-specific news with relevance scores (with checkpointing)
    """
    print("=" * 60)
    print("📰 Labeling Ticker News Relevance")
    print("=" * 60)

    df = pd.read_csv(input_file)
    print(f"Loaded {len(df)} records from {input_file}")

    # Check if checkpoint exists
    start_idx = 0
    if os.path.exists(checkpoint_file):
        checkpoint_df = pd.read_csv(checkpoint_file)
        start_idx = len(checkpoint_df)
        print(f"📌 Found checkpoint: resuming from record {start_idx}")
        df_processed = checkpoint_df
    else:
        df_processed = pd.DataFrame()

    print(f"Processing {len(df) - start_idx} remaining records in batches...")

    # Process in batches of 25 (reduced for stability)
    batch_size = 25
    total_batches = ((len(df) - start_idx) + batch_size - 1) // batch_size

    for i in range(start_idx, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]
        batch_num = ((i - start_idx) // batch_size) + 1

        try:
            # Get relevance scores for all headlines in parallel
            tasks = [gpt_relevance_score(row["headline"], row["ticker"])
                     for _, row in batch.iterrows()]
            scores = await asyncio.gather(*tasks)

            # Add scores to batch
            batch_copy = batch.copy()
            batch_copy["relevance"] = scores

            # Append to processed data
            df_processed = pd.concat(
                [df_processed, batch_copy], ignore_index=True)

            # Save checkpoint after every batch
            df_processed.to_csv(checkpoint_file, index=False)

            print(
                f"  Batch {batch_num}/{total_batches}: Processed {min(i+batch_size, len(df))}/{len(df)} records")
            print(
                f"    Batch avg relevance: {np.mean(scores):.3f}, min: {np.min(scores):.3f}, max: {np.max(scores):.3f}")

            # Small delay between batches to avoid rate limiting
            await asyncio.sleep(0.5)

        except Exception as e:
            print(f"  ❌ Error in batch {batch_num}: {e}")
            print(f"  💾 Progress saved to {checkpoint_file}")
            print(
                f"  🔄 Run script again to resume from record {len(df_processed)}")
            raise

    # Save final labeled file
    df_processed.to_csv(output_file, index=False)

    # Remove checkpoint file
    if os.path.exists(checkpoint_file):
        os.remove(checkpoint_file)
        print(f"🗑️  Removed checkpoint file")

    print(f"\n✅ Saved labeled file to {output_file}")
    print(
        f"   Relevance range: [{df_processed['relevance'].min():.3f}, {df_processed['relevance'].max():.3f}]")
    print(f"   Mean relevance: {df_processed['relevance'].mean():.3f}")
    print(f"   Median relevance: {df_processed['relevance'].median():.3f}")

    # Distribution stats
    highly_relevant = (df_processed['relevance'] >= 0.8).sum()
    relevant = ((df_processed['relevance'] >= 0.6) &
                (df_processed['relevance'] < 0.8)).sum()
    somewhat = ((df_processed['relevance'] >= 0.4) &
                (df_processed['relevance'] < 0.6)).sum()
    marginal = ((df_processed['relevance'] >= 0.2) &
                (df_processed['relevance'] < 0.4)).sum()
    not_relevant = (df_processed['relevance'] < 0.2).sum()

    print(f"\n📊 Distribution:")
    print(
        f"   Highly relevant (0.8-1.0): {highly_relevant} ({highly_relevant/len(df_processed)*100:.1f}%)")
    print(
        f"   Relevant (0.6-0.8): {relevant} ({relevant/len(df_processed)*100:.1f}%)")
    print(
        f"   Somewhat relevant (0.4-0.6): {somewhat} ({somewhat/len(df_processed)*100:.1f}%)")
    print(
        f"   Marginally relevant (0.2-0.4): {marginal} ({marginal/len(df_processed)*100:.1f}%)")
    print(
        f"   Not relevant (0.0-0.2): {not_relevant} ({not_relevant/len(df_processed)*100:.1f}%)")

    return df_processed


async def main_async():
    """
    Main async entry point - label ticker news relevance
    """
    print("🤖 Auto-Labeling Relevance with GPT-5-mini")
    print("=" * 60)

    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("   Set it with: export OPENAI_API_KEY='your-key'")
        return

    # Label ticker news
    try:
        await label_ticker_news()
    except FileNotFoundError as e:
        print(f"❌ File not found: {e}")
        print("   Make sure ticker_news_training_unlabeled.csv exists in data/")
    except Exception as e:
        print(f"❌ Error labeling ticker news: {e}")
        import traceback
        traceback.print_exc()
        return

    print("\n" + "=" * 60)
    print("✅ Relevance labeling complete!")
    print("=" * 60)
    print("\n📝 Next Steps:")
    print("1. Review data/ticker_news_training_labeled.csv for quality")
    print("2. Prepare training data:")
    print("   python3 scripts/prepare_training_data.py")
    print("3. Train the model:")
    print("   python3 training/train.py")


def main():
    """Wrapper to run async main"""
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
