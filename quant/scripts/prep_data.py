"""
Quick data prep script to create processed data for institutional system.
Uses existing Schwab data fetcher.
"""
import yaml
from datetime import datetime, timedelta
import pandas as pd
from pathlib import Path

from src.data.schwab_data import SchwabDataFetcher


def main():
    print("="*70)
    print(" DATA PREP - Converting to Institutional Format")
    print("="*70)

    print("PROGRESS:5:Loading configuration...", flush=True)
    # Load tickers from system specs
    with open("SYSTEM_SPEC.yaml", 'r') as f:
        config = yaml.safe_load(f)

    tickers = config['objectives']['universe']['tickers']
    total_tickers = len(tickers)
    print(f"\nTickers: {tickers}")
    print(f"Total: {total_tickers} tickers")

    print("PROGRESS:10:Initializing data fetcher...", flush=True)
    # Initialize fetcher
    fetcher = SchwabDataFetcher()

    # Fetch data for each ticker
    print("PROGRESS:15:Starting data fetch...", flush=True)
    for i, ticker in enumerate(tickers):
        # Calculate progress (15% to 95%)
        progress = 15 + int((i / total_tickers) * 80)
        print(
            f"PROGRESS:{progress}:Fetching {ticker} ({i+1}/{total_tickers})...", flush=True)

        try:
            from_date = (datetime.now() - timedelta(days=365*20)
                         ).strftime("%Y-%m-%d")
            to_date = datetime.now().strftime("%Y-%m-%d")
            print(f"  Date range: {from_date} to {to_date}")

            df = fetcher.fetch_aggregates(
                ticker=ticker,
                timespan='day',
                multiplier=1,
                from_date=from_date,
                to_date=to_date,
                limit=50000
            )

            if df is None or len(df) == 0:
                print(f"  ❌ No data received")
                continue

            # Calculate actual date range
            actual_start = df['timestamp'].min()
            actual_end = df['timestamp'].max()
            days_of_data = (actual_end - actual_start).days

            print(
                f"  ✓ {len(df)} bars | {days_of_data} days ({days_of_data/365:.1f} years)")
            print(f"  Latest bar: {actual_end.strftime('%Y-%m-%d')}")

            # Ensure columns
            df['ticker'] = ticker

            output_path = Path(
                f"data/processed/{ticker.lower()}_processed.csv")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            df.to_csv(output_path, index=False)

        except Exception as e:
            print(f"  Error fetching {ticker}: {e}")

    print("PROGRESS:100:Complete!", flush=True)
    print("\n" + "="*70)
    print(" DATA PREP COMPLETE")
    print("="*70)


if __name__ == "__main__":
    main()
