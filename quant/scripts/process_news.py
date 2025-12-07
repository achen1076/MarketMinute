import os
import yaml
import requests
import argparse
from datetime import datetime
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

    if not from_date and not to_date:
        today = datetime.now().strftime("%Y-%m-%d")
        from_date = today
        to_date = today
        print(f"No dates specified, using yesterday: {today}")

    print(f"Date range: {from_date} to {to_date or 'latest'}")
    print(f"Processing news for {len(tickers)} tickers via {webapp_url}\n")

    try:
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
            timeout=300
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
