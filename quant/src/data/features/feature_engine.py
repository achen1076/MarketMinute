"""
Master feature engineering engine.
Calculates all features according to institutional spec.
"""
import pandas as pd
import numpy as np
import logging
from sklearn.mixture import GaussianMixture

logger = logging.getLogger(__name__)


class FeatureEngine:
    """Calculate all features for the system."""
    
    def __init__(self, schema_version: str = "v2"):
        """Initialize feature engine."""
        self.schema_version = schema_version
    
    def calculate_all(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all features in one pass.
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with all features added
        """
        logger.info("Calculating all features...")
        df = df.copy()
        
        # Returns
        df = self._add_returns(df)
        
        # Volatility
        df = self._add_volatility(df)
        
        # Momentum
        df = self._add_momentum(df)
        
        # Price location
        df = self._add_price_location(df)
        
        # Time context
        df = self._add_time_context(df)
        
        # Liquidity
        df = self._add_liquidity(df)
        
        # Regime classification
        df = self._add_regime(df)
        
        logger.info(f"Feature engineering complete: {len(df.columns)} total columns")
        return df
    
    def _add_returns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add return features."""
        for period in [1, 3, 5, 15]:
            # Clip ratio to avoid log(0) or log(negative)
            price_ratio = df['close'] / df['close'].shift(period)
            price_ratio = price_ratio.clip(lower=1e-10)  # Prevent log(0) or log(negative)
            df[f'log_ret_{period}'] = np.log(price_ratio)
        return df
    
    def _add_volatility(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add volatility features."""
        # ATR
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = ranges.max(axis=1)
        df['atr_14'] = true_range.rolling(14).mean()
        
        # Realized volatility
        df['realized_vol_10'] = df['log_ret_1'].rolling(10).std()
        
        # Bollinger Bands
        df['bb_middle'] = df['close'].rolling(20).mean()
        df['bb_std'] = df['close'].rolling(20).std()
        df['bb_upper'] = df['bb_middle'] + (2 * df['bb_std'])
        df['bb_lower'] = df['bb_middle'] - (2 * df['bb_std'])
        df['bb_width_20'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
        
        # Vol z-score
        vol_mean = df['realized_vol_10'].rolling(50).mean()
        vol_std = df['realized_vol_10'].rolling(50).std()
        df['vol_zscore'] = (df['realized_vol_10'] - vol_mean) / vol_std
        
        return df
    
    def _add_momentum(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add momentum features."""
        # RSI
        for period in [3, 7, 14]:
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
            rs = gain / loss
            df[f'rsi_{period}'] = 100 - (100 / (1 + rs))
        
        # MACD
        ema_12 = df['close'].ewm(span=12).mean()
        ema_26 = df['close'].ewm(span=26).mean()
        df['macd_fast'] = ema_12 - ema_26
        df['macd_signal'] = df['macd_fast'].ewm(span=9).mean()
        
        # KAMA slope
        df['kama'] = self._calculate_kama(df['close'], 10)
        df['kama_slope'] = df['kama'].diff()
        
        # Momentum slopes
        df['mom_slope_5'] = df['close'].diff(5) / 5
        df['mom_slope_10'] = df['close'].diff(10) / 10
        
        return df
    
    def _add_price_location(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add price location features."""
        # VWAP
        df['vwap'] = (df['close'] * df['volume']).cumsum() / df['volume'].cumsum()
        vwap_mean = df['vwap'].rolling(20).mean()
        vwap_std = df['vwap'].rolling(20).std()
        df['zscore_vs_vwap'] = (df['close'] - df['vwap']) / vwap_std
        df['dist_from_vwap_pct'] = (df['close'] - df['vwap']) / df['vwap']
        
        # BB position
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
        
        # Distance from SMA
        df['sma_20'] = df['close'].rolling(20).mean()
        df['dist_sma20'] = (df['close'] - df['sma_20']) / df['sma_20']
        
        return df
    
    def _add_time_context(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add time-of-day features."""
        if 'timestamp' in df.columns:
            ts = pd.to_datetime(df['timestamp'])
        else:
            ts = pd.to_datetime(df.index)
        
        # Cyclical encoding
        minute_of_day = ts.dt.hour * 60 + ts.dt.minute
        df['minute_sin'] = np.sin(2 * np.pi * minute_of_day / (24 * 60))
        df['minute_cos'] = np.cos(2 * np.pi * minute_of_day / (24 * 60))
        
        day_of_week = ts.dt.dayofweek
        df['day_sin'] = np.sin(2 * np.pi * day_of_week / 7)
        df['day_cos'] = np.cos(2 * np.pi * day_of_week / 7)
        
        # Session indicators
        hour = ts.dt.hour
        minute = ts.dt.minute
        df['is_first_30min'] = ((hour == 9) & (minute < 60)).astype(int)
        df['is_last_30min'] = ((hour == 15) & (minute >= 30)).astype(int)
        df['is_open'] = ((hour == 9) & (minute >= 30) & (minute < 45)).astype(int)
        df['is_close'] = ((hour == 15) & (minute >= 45)).astype(int)
        
        return df
    
    def _add_liquidity(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add liquidity proxy features."""
        # Range
        df['hl_range_pct'] = (df['high'] - df['low']) / df['close']
        
        # Volume z-score
        vol_mean = df['volume'].rolling(20).mean()
        vol_std = df['volume'].rolling(20).std()
        df['volume_zscore'] = (df['volume'] - vol_mean) / vol_std
        
        # Spread proxy
        df['spread_proxy'] = df['hl_range_pct']
        
        # Dollar volume
        df['dollar_volume'] = df['close'] * df['volume']
        df['dollar_volume_ma'] = df['dollar_volume'].rolling(20).mean()
        
        # Volume ratio
        df['volume_ma'] = df['volume'].rolling(20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_ma']
        
        return df
    
    def _add_regime(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add regime classification (GMM k=4)."""
        # Use volatility, trend, liquidity for clustering
        features_for_clustering = df[['realized_vol_10', 'mom_slope_10', 'volume_zscore']].dropna()
        
        if len(features_for_clustering) > 100:
            gmm = GaussianMixture(n_components=4, random_state=42)
            
            # Fit and predict
            regime_labels = gmm.fit_predict(features_for_clustering)
            
            # Map back to full DataFrame
            df['vol_regime'] = 0
            df['trend_regime'] = 0
            df['liquidity_regime'] = 0
            
            df.loc[features_for_clustering.index, 'vol_regime'] = regime_labels
            df.loc[features_for_clustering.index, 'trend_regime'] = regime_labels
            df.loc[features_for_clustering.index, 'liquidity_regime'] = regime_labels
        else:
            df['vol_regime'] = 0
            df['trend_regime'] = 0
            df['liquidity_regime'] = 0
        
        return df
    
    @staticmethod
    def _calculate_kama(series: pd.Series, period: int = 10) -> pd.Series:
        """Calculate Kaufman Adaptive Moving Average."""
        change = abs(series.diff(period))
        volatility = series.diff().abs().rolling(period).sum()
        er = change / volatility  # Efficiency ratio
        
        fastest = 2 / (2 + 1)
        slowest = 2 / (30 + 1)
        sc = (er * (fastest - slowest) + slowest) ** 2  # Smoothing constant
        
        kama = pd.Series(index=series.index, dtype=float)
        kama.iloc[period] = series.iloc[period]
        
        for i in range(period + 1, len(series)):
            kama.iloc[i] = kama.iloc[i-1] + sc.iloc[i] * (series.iloc[i] - kama.iloc[i-1])
        
        return kama
