"""
Curated feature set - quality over quantity.
Only high-signal features proven in quantitative finance.
"""
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class CuratedFeatureEngine:
    """High-quality feature engineering for alpha generation."""

    def __init__(self):
        """Initialize curated feature engine."""
        pass

    def calculate_all(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate curated feature set (~25 high-quality features)."""
        logger.info("Calculating curated features...")
        df = df.copy()

        # Core returns (3 features)
        df = self._add_core_returns(df)

        # Volatility (3 features)
        df = self._add_volatility(df)

        # Momentum (4 features)
        df = self._add_momentum(df)

        # Volume (3 features)
        df = self._add_volume(df)

        # Price structure (3 features)
        df = self._add_price_structure(df)

        # Microstructure (3 features)
        df = self._add_microstructure(df)

        # Regime indicators (3 features)
        df = self._add_regime_indicators(df)

        # Interactions (3 features)
        df = self._add_interactions(df)

        logger.info(
            f"Curated features complete: {len(df.columns)} total columns")
        return df

    def _add_core_returns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Core return features."""
        # Log returns at key horizons
        df['ret_1'] = np.log(df['close'] / df['close'].shift(1))
        df['ret_5'] = np.log(df['close'] / df['close'].shift(5))
        df['ret_20'] = np.log(df['close'] / df['close'].shift(20))

        return df

    def _add_volatility(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean volatility features."""
        # Realized volatility
        df['rvol_10'] = df['ret_1'].rolling(10).std()

        # Parkinson volatility (more efficient, uses high-low)
        hl_ratio = df['high'] / df['low']
        hl_ratio = hl_ratio.replace([np.inf, -np.inf], np.nan)
        df['parkinson_vol'] = np.sqrt(
            (1 / (4 * np.log(2))) * (np.log(hl_ratio) ** 2))
        df['parkinson_vol'] = df['parkinson_vol'].replace(
            [np.inf, -np.inf], np.nan)

        # Volatility regime (z-score)
        vol_mean = df['rvol_10'].rolling(50).mean()
        vol_std = df['rvol_10'].rolling(50).std()
        df['vol_zscore'] = (df['rvol_10'] - vol_mean) / (vol_std + 1e-8)
        df['vol_zscore'] = df['vol_zscore'].clip(-5, 5)  # Clip extremes

        return df

    def _add_momentum(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean momentum features."""
        # RSI (single best period)
        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = -delta.where(delta < 0, 0).rolling(14).mean()
        rs = gain / (loss + 1e-8)
        df['rsi_14'] = 100 - (100 / (1 + rs))
        df['rsi_14'] = df['rsi_14'].clip(0, 100)

        # MACD
        ema_12 = df['close'].ewm(span=12, adjust=False).mean()
        ema_26 = df['close'].ewm(span=26, adjust=False).mean()
        df['macd'] = ema_12 - ema_26
        df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()

        # Price momentum (rate of change)
        df['roc_10'] = (df['close'] - df['close'].shift(10)) / \
            (df['close'].shift(10) + 1e-8)
        df['roc_10'] = df['roc_10'].clip(-0.5, 0.5)

        return df

    def _add_volume(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean volume features."""
        # Volume ratio
        vol_ma = df['volume'].rolling(20).mean()
        df['volume_ratio'] = df['volume'] / (vol_ma + 1e-8)
        df['volume_ratio'] = df['volume_ratio'].clip(0, 10)

        # On-Balance Volume momentum
        obv_sign = np.sign(df['close'].diff())
        obv = (df['volume'] * obv_sign).cumsum()
        df['obv_slope'] = (obv - obv.shift(10)) / 10

        # Volume-weighted momentum
        df['vol_weighted_ret'] = df['ret_5'] * df['volume_ratio']
        df['vol_weighted_ret'] = df['vol_weighted_ret'].clip(-10, 10)

        return df

    def _add_price_structure(self, df: pd.DataFrame) -> pd.DataFrame:
        """Price structure features."""
        # Distance from moving averages
        sma_20 = df['close'].rolling(20).mean()
        df['dist_sma20'] = (df['close'] - sma_20) / (sma_20 + 1e-8)
        df['dist_sma20'] = df['dist_sma20'].clip(-0.5, 0.5)

        # Bollinger Band position
        bb_std = df['close'].rolling(20).std()
        bb_upper = sma_20 + (2 * bb_std)
        bb_lower = sma_20 - (2 * bb_std)
        df['bb_position'] = (df['close'] - bb_lower) / \
            (bb_upper - bb_lower + 1e-8)
        df['bb_position'] = df['bb_position'].clip(0, 1)

        # High-low range
        df['hl_range'] = (df['high'] - df['low']) / (df['close'] + 1e-8)
        df['hl_range'] = df['hl_range'].clip(0, 0.5)

        return df

    def _add_microstructure(self, df: pd.DataFrame) -> pd.DataFrame:
        """Microstructure features."""
        # Buy/sell pressure
        df['buy_pressure'] = (df['close'] - df['low']) / \
            (df['high'] - df['low'] + 1e-8)
        df['buy_pressure'] = df['buy_pressure'].clip(0, 1)

        # Price impact proxy
        df['price_impact'] = abs(df['ret_1']) / \
            (np.log(df['volume'] + 1) + 1e-8)
        df['price_impact'] = df['price_impact'].clip(0, 0.1)

        # Amihud illiquidity (safe version)
        dollar_volume = df['close'] * df['volume']
        df['illiquidity'] = abs(df['ret_1']) / (dollar_volume + 1e-8)
        df['illiquidity'] = df['illiquidity'].clip(0, 1e-6)

        return df

    def _add_regime_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Market regime indicators."""
        # Trend strength (ADX-like)
        df['trend_strength'] = abs(df['dist_sma20'])

        # Volatility breakout
        vol_upper = df['rvol_10'].rolling(50).quantile(0.75)
        df['vol_breakout'] = (df['rvol_10'] > vol_upper).astype(int)

        # Momentum regime
        df['momentum_regime'] = (df['rsi_14'] > 50).astype(int)

        return df

    def _add_interactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Key feature interactions."""
        # Volume * Volatility (liquidity stress)
        df['vol_volume'] = df['rvol_10'] * df['volume_ratio']
        df['vol_volume'] = df['vol_volume'].clip(0, 20)

        # Momentum * Volatility
        df['mom_vol'] = df['roc_10'] * df['rvol_10']
        df['mom_vol'] = df['mom_vol'].clip(-1, 1)

        # RSI * Volume (conviction indicator)
        df['rsi_volume'] = (df['rsi_14'] - 50) * df['volume_ratio'] / 50
        df['rsi_volume'] = df['rsi_volume'].clip(-10, 10)

        return df
