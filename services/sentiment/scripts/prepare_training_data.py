"""
Prepare labeled training data for model training
Combines ticker news and general news into a single training CSV
"""

import pandas as pd
import os


def prepare_training_data():
    print("=" * 60)
    print("📊 Preparing Training Data")
    print("=" * 60)

    # Read labeled data
    ticker_file = "../data/ticker_news_training_labeled.csv"
    general_file = "../data/general_news_training_labeled.csv"
    output_file = "../data/combined_training_data.csv"

    all_data = []

    # Process ticker news
    if os.path.exists(ticker_file):
        print(f"\n📰 Loading ticker news from {ticker_file}...")
        ticker_df = pd.read_csv(ticker_file)
        print(f"   Loaded {len(ticker_df)} ticker news records")

        # Extract text (headline) and sentiment
        for _, row in ticker_df.iterrows():
            all_data.append({
                'text': row['headline'],
                'sentiment': row['final_sentiment']
            })

    # Process general news
    if os.path.exists(general_file):
        print(f"\n🌍 Loading general news from {general_file}...")
        general_df = pd.read_csv(general_file)
        print(f"   Loaded {len(general_df)} general news records")

        # Extract text (headline) and sentiment
        for _, row in general_df.iterrows():
            all_data.append({
                'text': row['headline'],
                'sentiment': row['final_sentiment']
            })

    # Create combined dataframe
    combined_df = pd.DataFrame(all_data)

    # Remove any NaN sentiments
    before = len(combined_df)
    combined_df = combined_df.dropna(subset=['sentiment'])
    after = len(combined_df)

    if before > after:
        print(
            f"\n⚠️  Removed {before - after} records with missing sentiment scores")

    # Save to CSV
    combined_df.to_csv(output_file, index=False)

    print(f"\n✅ Combined training data saved to {output_file}")
    print(f"\n📊 Dataset Statistics:")
    print(f"   Total records: {len(combined_df)}")
    print(
        f"   Sentiment range: [{combined_df['sentiment'].min():.2f}, {combined_df['sentiment'].max():.2f}]")
    print(f"   Mean sentiment: {combined_df['sentiment'].mean():.3f}")
    print(f"   Std deviation: {combined_df['sentiment'].std():.3f}")

    # Show distribution
    print(f"\n📈 Sentiment Distribution:")
    print(
        f"   Negative (< -0.3): {(combined_df['sentiment'] < -0.3).sum()} ({(combined_df['sentiment'] < -0.3).sum() / len(combined_df) * 100:.1f}%)")
    print(
        f"   Neutral (-0.3 to 0.3): {((combined_df['sentiment'] >= -0.3) & (combined_df['sentiment'] <= 0.3)).sum()} ({((combined_df['sentiment'] >= -0.3) & (combined_df['sentiment'] <= 0.3)).sum() / len(combined_df) * 100:.1f}%)")
    print(
        f"   Positive (> 0.3): {(combined_df['sentiment'] > 0.3).sum()} ({(combined_df['sentiment'] > 0.3).sum() / len(combined_df) * 100:.1f}%)")

    print(f"\n📝 Next Step:")
    print(f"   Run the training script to train your model!")
    print(f"   cd ../training && python train_new_model.py")

    return output_file


if __name__ == "__main__":
    prepare_training_data()
