"""
Financial Modeling Prep (FMP) API data fetcher for historical market data.
FMP API Docs: https://site.financialmodelingprep.com/developer/docs
"""
import os
from datetime import datetime, timedelta
from typing import Optional
import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()


class FMPDataFetcher:
    """Fetch historical data from Financial Modeling Prep API."""

    BASE_URL = "https://financialmodelingprep.com/stable"

    def __init__(self, api_key: Optional[str] = None):
        """Initialize FMP API client."""
        self.api_key = api_key or os.getenv("FMP_API_KEY")
        if not self.api_key:
            raise ValueError(
                "FMP_API_KEY is required. Set it in environment variables.")

    def fetch_aggregates(
        self,
        ticker: str,
        timespan: str = "minute",
        multiplier: int = 5,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        limit: int = 5000
    ) -> pd.DataFrame:
        """
        Fetch historical aggregate bars (OHLCV data).

        Args:
            ticker: Stock ticker symbol
            timespan: "minute" (intraday), "day", "week", or "month"
            multiplier: Interval for intraday data (1, 5, 15, 30, 60 minutes)
            from_date: Start date (YYYY-MM-DD format)
            to_date: End date (YYYY-MM-DD format)
            limit: Max number of bars (not used, FMP returns all data in range)

        Returns:
            DataFrame with: timestamp, open, high, low, close, volume
        """
        # Default to 5 years of data
        if not from_date:
            from_date = (datetime.now() - timedelta(days=365*5)
                         ).strftime("%Y-%m-%d")
        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")

        # Choose endpoint based on timespan
        if timespan == "minute":
            # FMP intraday data (only available for recent dates)
            print('minute!')
            df = self._fetch_intraday(ticker, multiplier, from_date, to_date)
        else:
            # FMP historical daily data
            df = self._fetch_historical_daily(ticker, from_date, to_date)

        return df.tail(limit) if len(df) > limit else df

    def _fetch_historical_daily(self, ticker: str, from_date: str, to_date: str) -> pd.DataFrame:
        """Fetch historical daily OHLCV data."""
        url = f"{self.BASE_URL}/historical-price-eod/full"
        params = {
            "symbol": ticker,
            "apikey": self.api_key,
            "from": from_date,
            "to": to_date
        }

        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data or not isinstance(data, list):
            print(f"[FMP] No data returned for {ticker}")
            return pd.DataFrame()

        # Convert to DataFrame
        df = pd.DataFrame(data)

        # Rename columns to match expected format
        df = df.rename(columns={
            "date": "timestamp"
        })

        # Convert timestamp to datetime
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        # Sort by date (FMP returns descending, we want ascending)
        df = df.sort_values("timestamp").reset_index(drop=True)

        # Select only required columns in correct order
        df = df[["timestamp", "open", "high", "low", "close", "volume"]]

        return df

    def _fetch_intraday(self, ticker: str, interval: int, from_date: str, to_date: str) -> pd.DataFrame:
        """
        Fetch intraday minute-level data.
        Note: FMP intraday data is limited to recent dates (typically last 1-5 days depending on plan).
        """
        # Map interval to FMP format (1min, 5min, 15min, 30min, 1hour)
        interval_map = {
            1: "1min",
            5: "5min",
            15: "15min",
            30: "30min",
            60: "1hour"
        }
        interval_str = interval_map.get(interval, "5min")

        url = f"{self.BASE_URL}/historical-chart/{interval_str}"
        params = {
            "symbol": ticker,
            "apikey": self.api_key,
            "from": from_date,
            "to": to_date
        }

        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        if not data or not isinstance(data, list):
            print(f"[FMP] No intraday data returned for {ticker}")
            return pd.DataFrame()

        # Convert to DataFrame
        df = pd.DataFrame(data)

        # Rename and convert timestamp
        df = df.rename(columns={"date": "timestamp"})
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        # Sort by timestamp (FMP returns descending)
        df = df.sort_values("timestamp").reset_index(drop=True)

        # Select only required columns
        df = df[["timestamp", "open", "high", "low", "close", "volume"]]

        return df

    def fetch_quote(self, ticker: str) -> dict:
        """Fetch current quote for a ticker."""
        url = f"{self.BASE_URL}/quote"
        params = {
            "symbol": ticker,
            "apikey": self.api_key
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data and isinstance(data, list) and len(data) > 0:
            return data[0]  # FMP returns list with single quote
        return {}

    def save_to_csv(self, df: pd.DataFrame, filepath: str):
        """Save DataFrame to CSV file."""
        df.to_csv(filepath, index=False)


# Quick test
if __name__ == "__main__":
    fetcher = FMPDataFetcher()
    df = fetcher.fetch_aggregates(
        ticker="AAPL",
        timespan="minute",
        from_date=(datetime.now() - timedelta(days=365*5)).strftime("%Y-%m-%d")
    )
    print(f"Fetched {len(df)} bars for AAPL")
    print(df.head())
    print(df.tail())
