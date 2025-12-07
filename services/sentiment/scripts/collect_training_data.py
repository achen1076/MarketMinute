"""
Daily Training Data Collection Script

Collects news articles for 200+ tickers and general market news,
along with stock price movements and major index movements.
Stores data in database for model training.

Run this script daily via cron job.
"""

import os
import sys
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import time

# FMP API Configuration
API_KEY = os.getenv("FMP_API_KEY")
if not API_KEY:
    raise ValueError("FMP_API_KEY environment variable not set")
BASE_URL = "https://financialmodelingprep.com/stable"

# Import tickers from quant lambda
sys.path.append(os.path.join(os.path.dirname(
    __file__), "../../../quant/lambda"))
try:
    from tickers import TICKERS
except ImportError:
    # Fallback if import fails
    TICKERS = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "WMT",
        # Add more as needed
    ]

# Major Indices
INDICES = {
    "dow": "^DJI",
    "sp500": "^GSPC",
    "nasdaq": "^IXIC"
}


def fetch_stock_quote(symbol: str, date: Optional[str] = None) -> Optional[Dict]:
    """
    Fetch stock quote for a specific date
    If no date provided, uses latest quote
    """
    try:
        if date:
            # Historical price
            url = f"{BASE_URL}/historical-price-eod/full"
            params = {"symbol": symbol, "from": date,
                      "to": date, "apikey": API_KEY}
        else:
            # Latest quote
            url = f"{BASE_URL}/quote"
            params = {"symbol": symbol, "apikey": API_KEY}

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if date and isinstance(data, list) and len(data) > 0:
            return data[0]
        elif not date and isinstance(data, list) and len(data) > 0:
            return data[0]

        return None
    except Exception as e:
        print(f"Error fetching quote for {symbol}: {e}")
        return None


def calculate_daily_change_pct(symbol: str, target_date: str) -> Optional[float]:
    """
    Calculate the daily percentage change for a stock on a specific date
    """
    try:
        # Get data for target date and previous day
        target = datetime.strptime(target_date, "%Y-%m-%d")
        prev_date = (target - timedelta(days=1)).strftime("%Y-%m-%d")

        url = f"{BASE_URL}/historical-price-eod/full"
        params = {
            "symbol": symbol,
            "from": prev_date,
            "to": target_date,
            "apikey": API_KEY
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, list) and len(data) >= 2:
            # Sort by date
            hist = sorted(data, key=lambda x: x["date"])
            prev_close = hist[0]["close"]
            target_close = hist[-1]["close"]
            change_pct = ((target_close - prev_close) / prev_close) * 100
            return round(change_pct, 2)

        return None
    except Exception as e:
        print(f"Error calculating change for {symbol}: {e}")
        return None


def fetch_index_movements(date: str) -> Dict[str, float]:
    """
    Fetch the daily percentage changes for major indices (Dow, S&P, NASDAQ)
    """
    movements = {}

    for index_name, index_symbol in INDICES.items():
        change_pct = calculate_daily_change_pct(index_symbol, date)
        if change_pct is not None:
            movements[index_name] = change_pct
            print(f"  {index_name.upper()}: {change_pct:+.2f}%")
        else:
            movements[index_name] = 0.0
            print(f"  {index_name.upper()}: N/A (using 0.0)")

        time.sleep(0.2)  # Rate limiting

    return movements


def fetch_ticker_news(symbol: str, date: str, limit: int = 50) -> List[Dict]:
    """
    Fetch news articles for a specific ticker on a specific date
    """
    try:
        url = f"{BASE_URL}/news/stock"
        params = {
            "symbols": symbol,
            "from": date,
            "to": date,
            "apikey": API_KEY
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching ticker news: {e}")
        return []


def fetch_general_news(date: str, page: int = 0, limit: int = 100) -> List[Dict]:
    """
    Fetch general market news for a specific date
    """
    try:
        url = f"{BASE_URL}/news/general-latest"
        params = {
            "from": date,
            "to": date,
            "apikey": API_KEY
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching general news: {e}")
        return []


def collect_ticker_training_data(date: str) -> List[Dict]:
    """
    Collect training data for ticker news
    Returns list of records ready for database insertion
    """
    print(f"\n📰 Collecting ticker news for {date}...")

    # Get index movements first
    print("📊 Fetching index movements...")
    index_movements = fetch_index_movements(date)

    training_data = []

    # Process tickers one at a time
    for i, ticker in enumerate(TICKERS, 1):
        print(f"\n[{i}/{len(TICKERS)}] Processing {ticker}...")

        # Fetch news for this ticker
        news_articles = fetch_ticker_news(ticker, date, limit=50)

        if not news_articles:
            continue

        # Get stock movement for this ticker once
        stock_change = calculate_daily_change_pct(ticker, date)
        if stock_change is None:
            print(f"  ⚠️  No price data for {ticker}, skipping...")
            continue

        # Process each article for this ticker
        articles_added = 0
        for article in news_articles:
            headline = article.get("title", "")
            if not headline:
                continue

            record = {
                "date": date,
                "ticker": ticker,
                "headline": headline,
                "newsUrl": article.get("url"),
                "stockChangePct": stock_change,
                "dowChangePct": index_movements.get("dow", 0.0),
                "spChangePct": index_movements.get("sp500", 0.0),
                "nasdaqChangePct": index_movements.get("nasdaq", 0.0),
            }

            training_data.append(record)
            articles_added += 1

        print(
            f"  Added {articles_added} articles (Total: {len(training_data)})")
        time.sleep(0.3)  # Rate limiting between tickers

    print(f"\n✅ Total ticker news records: {len(training_data)}")
    return training_data


def collect_general_training_data(date: str) -> List[Dict]:
    """
    Collect training data for general market news
    Returns list of records ready for database insertion
    """
    print(f"\n🌍 Collecting general market news for {date}...")

    # Get index movements
    print("📊 Fetching index movements...")
    index_movements = fetch_index_movements(date)

    training_data = []

    # Fetch general news
    news_articles = fetch_general_news(date)

    for article in news_articles:
        headline = article.get("title", "")
        if not headline:
            continue

        record = {
            "date": date,
            "headline": headline,
            "newsUrl": article.get("url"),
            "dowChangePct": index_movements.get("dow", 0.0),
            "spChangePct": index_movements.get("sp500", 0.0),
            "nasdaqChangePct": index_movements.get("nasdaq", 0.0),
        }

        training_data.append(record)

    print(f"✅ Total general news records: {len(training_data)}")
    return training_data


def save_to_database(ticker_data: List[Dict], general_data: List[Dict]) -> bool:
    """
    Save collected training data to database via Next.js API in batches
    """
    try:
        webapp_url = os.getenv("WEBAPP_URL", "http://localhost:3000")
        api_url = f"{webapp_url}/api/training-data"

        print(f"\n💾 Saving to database via {api_url}...")

        # Save in batches to avoid timeouts
        batch_size = 100
        ticker_batches = [ticker_data[i:i + batch_size]
                          for i in range(0, len(ticker_data), batch_size)]

        total_ticker_saved = 0
        total_general_saved = 0

        # Save ticker news in batches
        for i, batch in enumerate(ticker_batches, 1):
            print(
                f"  Saving ticker batch {i}/{len(ticker_batches)} ({len(batch)} records)...")
            payload = {"tickerNews": batch, "generalNews": []}
            response = requests.post(api_url, json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            total_ticker_saved += result.get('tickerCount', 0)
            time.sleep(0.5)  # Brief pause between batches

        # Save general news
        if general_data:
            print(f"  Saving general news ({len(general_data)} records)...")
            payload = {"tickerNews": [], "generalNews": general_data}
            response = requests.post(api_url, json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            total_general_saved = result.get('generalCount', 0)

        print(f"✅ Saved successfully:")
        print(f"   - Ticker news: {total_ticker_saved} records")
        print(f"   - General news: {total_general_saved} records")

        return True
    except Exception as e:
        print(f"❌ Error saving to database: {e}")
        return False


def main():
    """
    Main entry point for daily training data collection
    """
    print("=" * 60)
    print("📊 Daily Training Data Collection")
    print("=" * 60)

    target_date = (datetime.now() - timedelta(days=0)
                   ).strftime("%Y-%m-%d")
    print(f"Target date: {target_date}")
    print(f"Processing {len(TICKERS)} tickers")

    # Collect ticker news training data
    ticker_data = collect_ticker_training_data(target_date)

    # Collect general news training data
    general_data = collect_general_training_data(target_date)

    # Save to database
    if ticker_data or general_data:
        success = save_to_database(ticker_data, general_data)
        if success:
            print("\n✅ Training data collection completed successfully!")
        else:
            print("\n⚠️ Data collected but failed to save to database")
        print("   You may need to manually import the data")
    else:
        print("\n⚠️ No data collected")

    print("=" * 60)


if __name__ == "__main__":
    main()
