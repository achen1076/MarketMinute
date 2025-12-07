"""
Process news for all tickers before generating predictions.

Fetches news from FMP API, scores with ML services, and saves to NewsItem database.
Should be run before generate_predictions.py in the cron job.

Usage: 
  python3 scripts/process_news.py                    # Yesterday's news
  python3 scripts/process_news.py --from 2025-12-05  # From specific date
  python3 scripts/process_news.py --from 2025-12-05 --to 2025-12-06  # Date range
"""

import os
import sys
import yaml
import requests
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv()


def process_news_for_tickers(from_date=None, to_date=None):
    """Fetch and process news for all tickers in SYSTEM_SPEC."""
    print("=" * 70)
    print(" PROCESSING NEWS FOR PREDICTIONS")
    print("=" * 70)
    print()

    # Load required environment variables
    webapp_url = os.getenv("WEBAPP_URL", "http://localhost:3000")

    # Load tickers from SYSTEM_SPEC.yaml
    spec_file = Path("SYSTEM_SPEC.yaml")
    if not spec_file.exists():
        print("❌ Error: SYSTEM_SPEC.yaml not found")
        return

    with open(spec_file, 'r') as f:
        config = yaml.safe_load(f)

    tickers = config['objectives']['universe']['tickers']

    # Default to yesterday if no dates provided
    if not from_date and not to_date:
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        from_date = yesterday
        to_date = yesterday
        print(f"No dates specified, using yesterday: {yesterday}")

    print(f"Date range: {from_date} to {to_date or 'latest'}")
    print(f"Processing news for {len(tickers)} tickers via {webapp_url}\n")

    try:
        # Call webapp batch processing endpoint
        url = f"{webapp_url}/api/news/process-batch"
        payload = {"tickers": tickers}
        if from_date:
            payload["from"] = from_date
        if to_date:
            payload["to"] = to_date

        print("Starting batch processing...")
        print("(Check webapp terminal for detailed progress)\n")

        response = requests.post(
            url,
            json=payload,
            timeout=300  # 5 minutes timeout
        )
        response.raise_for_status()

        data = response.json()
        print()
        print("=" * 70)
        print(
            f" COMPLETE: {data['saved']} news items saved from {data['processed']} tickers")
        print("=" * 70)
        print()

    except Exception as e:
        print(f"❌ Error: {e}")
        print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Process news for predictions')
    parser.add_argument('--from', dest='from_date',
                        type=str, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--to', dest='to_date', type=str,
                        help='End date (YYYY-MM-DD)')

    args = parser.parse_args()

    process_news_for_tickers(from_date=args.from_date, to_date=args.to_date)
