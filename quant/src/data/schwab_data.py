"""
Charles Schwab API data fetcher for historical market data.
Requires schwab-py library: pip install schwab-py
"""
import os
from datetime import datetime, timedelta
from typing import Optional
import pandas as pd
import pytz
from dotenv import load_dotenv
import schwab

load_dotenv()


class SchwabDataFetcher:
    """Fetch historical data from Charles Schwab API."""

    def __init__(self, app_key: Optional[str] = None, app_secret: Optional[str] = None,
                 token_path: str = "schwab_token.json"):
        """Initialize Schwab API client."""
        self.app_key = app_key or os.getenv("SCHWAB_APP_KEY")
        self.app_secret = app_secret or os.getenv("SCHWAB_APP_SECRET")
        self.token_path = token_path
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize Schwab client with OAuth authentication."""
        self.client = schwab.auth.client_from_token_file(
            self.token_path,
            self.app_key,
            self.app_secret
        )

    def _convert_timespan(self, timespan: str, multiplier: int = 1) -> tuple:
        """
        Convert generic timespan parameters to Schwab API enum types.

        Args:
            timespan: Generic timespan string ("minute", "hour", "day")
            multiplier: Timespan multiplier (e.g., 5 for 5-minute bars)

        Returns:
            (frequency_type_enum, frequency_enum): Schwab API enum objects
        """
        # Import Schwab enum types
        FreqType = schwab.client.Client.PriceHistory.FrequencyType
        Freq = schwab.client.Client.PriceHistory.Frequency

        # Convert to Schwab-specific enums
        if timespan == "minute":
            if multiplier == 1:
                return (FreqType.MINUTE, Freq.EVERY_MINUTE)
            elif multiplier == 5:
                return (FreqType.MINUTE, Freq.EVERY_FIVE_MINUTES)
            elif multiplier == 15:
                return (FreqType.MINUTE, Freq.EVERY_FIFTEEN_MINUTES)
            elif multiplier == 30:
                return (FreqType.MINUTE, Freq.EVERY_THIRTY_MINUTES)
        elif timespan == "day":
            return (FreqType.DAILY, None)
        elif timespan == "week":
            return (FreqType.WEEKLY, None)
        elif timespan == "month":
            return (FreqType.MONTHLY, None)

        # Default to 1-minute
        return (FreqType.MINUTE, Freq.EVERY_MINUTE)

    def fetch_aggregates(
        self,
        ticker: str,
        timespan: str = "minute",
        multiplier: int = 1,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        limit: int = 5000
    ) -> pd.DataFrame:
        """
        Fetch historical aggregate bars (OHLCV data).

        Args:
            ticker: Stock ticker symbol
            timespan: "minute", "hour", or "day"
            multiplier: Multiplier for timespan (1, 5, 15, 30 for minutes)
            from_date: Start date (YYYY-MM-DD format)
            to_date: End date (YYYY-MM-DD format)
            limit: Max number of bars (not used directly, controlled by date range)

        Returns:
            DataFrame with: timestamp, open, high, low, close, volume
        """
        from_date = from_date or (
            datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        to_date = to_date or datetime.now().strftime("%Y-%m-%d")

        # Convert dates to timezone-aware datetimes
        et_tz = pytz.timezone('America/New_York')
        start_dt = et_tz.localize(datetime.strptime(from_date, "%Y-%m-%d"))
        end_dt = et_tz.localize(datetime.strptime(
            to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59))

        # Get Schwab API parameters and fetch
        freq_type, frequency = self._convert_timespan(timespan, multiplier)

        if timespan == 'minute':
            response = self.client.get_price_history(
                ticker,
                frequency_type=freq_type,
                frequency=frequency,
                start_datetime=start_dt,
                end_datetime=end_dt,
                need_extended_hours_data=False
            )
        else:
            response = self.client.get_price_history(
                ticker,
                period_type=self.client.PriceHistory.PeriodType.YEAR,
                period=self.client.PriceHistory.Period.TWENTY_YEARS,
                start_datetime=start_dt,
                end_datetime=end_dt,
                frequency_type=freq_type,
                need_extended_hours_data=False
            )

        response.raise_for_status()  # Raise exception if API error
        candles = response.json().get('candles', [])

        # Convert to DataFrame
        df = pd.DataFrame([{
            "timestamp": pd.to_datetime(candle['datetime'], unit='ms', utc=True).tz_convert(et_tz).tz_localize(None),
            "open": candle['open'],
            "high": candle['high'],
            "low": candle['low'],
            "close": candle['close'],
            "volume": candle['volume']
        } for candle in candles])

        return df.tail(limit) if len(df) > limit else df

    def fetch_quote(self, ticker: str) -> dict:
        """Fetch current quote for a ticker."""
        response = self.client.get_quote(ticker)
        response.raise_for_status()
        return response.json()

    def save_to_csv(self, df: pd.DataFrame, filepath: str):
        """Save DataFrame to CSV file."""
        df.to_csv(filepath, index=False)


# Quick test
if __name__ == "__main__":
    fetcher = SchwabDataFetcher()
    df = fetcher.fetch_aggregates(
        ticker="AAPL",
        timespan="minute",
        multiplier=5,
        from_date=(datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
    )
    print(f"Fetched {len(df)} bars")
    print(df.head())
