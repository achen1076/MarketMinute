"""
Prepare training data from labeled CSV for model training
Extracts headline, ticker, and relevance columns into clean training format
"""

import pandas as pd
from pathlib import Path


def prepare_training_data(
    input_file="data/ticker_news_training_labeled.csv",
    output_file="data/relevance_train.csv"
):
    """
    Extract and prepare training data from labeled news

    Input format: date, ticker, headline, sentiment, stockChangePct, ..., relevance
    Output format: headline, ticker, relevance
    """
    print("=" * 60)
    print("📋 Preparing Training Data")
    print("=" * 60)

    # Load labeled data
    df = pd.read_csv(input_file)
    print(f"Loaded {len(df)} labeled records")

    # Check for required columns
    if 'relevance' not in df.columns:
        print("❌ Error: 'relevance' column not found in input file")
        print("   Run: python3 scripts/auto_label_relevance.py first")
        return

    if 'headline' not in df.columns or 'ticker' not in df.columns:
        print("❌ Error: 'headline' or 'ticker' column not found")
        return

    # Extract only what we need
    training_df = df[['headline', 'ticker', 'relevance']].copy()

    # Remove any rows with missing values
    before = len(training_df)
    training_df = training_df.dropna()
    after = len(training_df)

    if before > after:
        print(f"⚠️  Removed {before - after} rows with missing values")

    # Ensure relevance is in valid range
    training_df['relevance'] = training_df['relevance'].clip(0.0, 1.0)

    # Save training data
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    training_df.to_csv(output_path, index=False)

    print(f"\n✅ Saved training data to {output_file}")
    print(f"   Total samples: {len(training_df)}")
    print(
        f"   Relevance range: [{training_df['relevance'].min():.3f}, {training_df['relevance'].max():.3f}]")
    print(f"   Mean relevance: {training_df['relevance'].mean():.3f}")

    # Show sample
    print(f"\n📝 Sample data:")
    print(training_df.head(5).to_string(index=False))

    return training_df


if __name__ == "__main__":
    prepare_training_data()
