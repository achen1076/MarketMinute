"""
regime_detector.py
---------------------------------------------------------------------
Market regime detection for adaptive model training and evaluation.

Detects market regimes using multiple indicators:
    - Trend regime: Bull, Bear, Sideways (based on moving averages)
    - Volatility regime: Low, Normal, High (based on ATR/historical vol)
    - Momentum regime: Strong, Weak, Reversal (based on RSI/momentum)

Models can be trained/evaluated per regime or use regime as a feature.

Usage:
    detector = RegimeDetector()
    df = detector.detect_regimes(df)
    regime_stats = detector.get_regime_statistics(df)
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class TrendRegime(Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"


class VolatilityRegime(Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


class MomentumRegime(Enum):
    STRONG_UP = "strong_up"
    STRONG_DOWN = "strong_down"
    WEAK = "weak"
    REVERSAL = "reversal"


@dataclass
class RegimeState:
    """Current market regime state"""
    trend: TrendRegime
    volatility: VolatilityRegime
    momentum: MomentumRegime
    composite_score: float

    def to_dict(self) -> Dict:
        return {
            'trend': self.trend.value,
            'volatility': self.volatility.value,
            'momentum': self.momentum.value,
            'composite_score': self.composite_score
        }

    def __str__(self) -> str:
        return f"{self.trend.value}/{self.volatility.value}/{self.momentum.value}"


class RegimeDetector:
    """
    Multi-factor market regime detection.

    Combines trend, volatility, and momentum analysis to classify
    market conditions and provide context for model predictions.
    """

    def __init__(
        self,
        trend_fast_period: int = 20,
        trend_slow_period: int = 50,
        trend_long_period: int = 200,
        vol_lookback: int = 20,
        vol_long_lookback: int = 60,
        momentum_period: int = 14,
        trend_threshold: float = 0.02,
        vol_low_percentile: float = 25,
        vol_high_percentile: float = 75
    ):
        """
        Initialize regime detector.

        Args:
            trend_fast_period: Fast MA period for trend detection
            trend_slow_period: Slow MA period for trend detection
            trend_long_period: Long-term MA for major trend
            vol_lookback: Short-term volatility lookback
            vol_long_lookback: Long-term volatility lookback for comparison
            momentum_period: RSI/momentum calculation period
            trend_threshold: Minimum % difference for trend classification
            vol_low_percentile: Percentile below which volatility is "low"
            vol_high_percentile: Percentile above which volatility is "high"
        """
        self.trend_fast = trend_fast_period
        self.trend_slow = trend_slow_period
        self.trend_long = trend_long_period
        self.vol_lookback = vol_lookback
        self.vol_long_lookback = vol_long_lookback
        self.momentum_period = momentum_period
        self.trend_threshold = trend_threshold
        self.vol_low_pct = vol_low_percentile
        self.vol_high_pct = vol_high_percentile

    def detect_regimes(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect all regime types and add columns to dataframe.

        Args:
            df: DataFrame with OHLCV data (requires 'close', 'high', 'low')

        Returns:
            DataFrame with regime columns added
        """
        df = df.copy()

        # Calculate regime indicators
        df = self._calculate_trend_indicators(df)
        df = self._calculate_volatility_indicators(df)
        df = self._calculate_momentum_indicators(df)

        # Classify regimes
        df['trend_regime'] = df.apply(self._classify_trend, axis=1)
        df['volatility_regime'] = df.apply(self._classify_volatility, axis=1)
        df['momentum_regime'] = df.apply(self._classify_momentum, axis=1)

        # Composite regime score (-1 to +1, bearish to bullish)
        df['regime_score'] = self._calculate_composite_score(df)

        # Regime numeric encoding for ML features
        df['trend_regime_num'] = df['trend_regime'].map({
            'bull': 1, 'sideways': 0, 'bear': -1
        })
        df['volatility_regime_num'] = df['volatility_regime'].map({
            'high': 1, 'normal': 0, 'low': -1
        })
        df['momentum_regime_num'] = df['momentum_regime'].map({
            'strong_up': 1, 'weak': 0, 'strong_down': -1, 'reversal': 0
        })

        return df

    def _calculate_trend_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate trend-related indicators"""
        close = df['close']

        # Moving averages
        df['ma_fast'] = close.rolling(window=self.trend_fast).mean()
        df['ma_slow'] = close.rolling(window=self.trend_slow).mean()
        df['ma_long'] = close.rolling(window=self.trend_long).mean()

        # MA slopes (rate of change)
        df['ma_fast_slope'] = df['ma_fast'].pct_change(5)
        df['ma_slow_slope'] = df['ma_slow'].pct_change(10)

        # Price position relative to MAs
        df['price_vs_fast'] = (close - df['ma_fast']) / df['ma_fast']
        df['price_vs_slow'] = (close - df['ma_slow']) / df['ma_slow']
        df['price_vs_long'] = (close - df['ma_long']) / df['ma_long']

        # MA alignment score
        df['ma_alignment'] = (
            (df['ma_fast'] > df['ma_slow']).astype(int) +
            (df['ma_slow'] > df['ma_long']).astype(int) +
            (close > df['ma_fast']).astype(int)
        ) / 3.0

        return df

    def _calculate_volatility_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate volatility-related indicators"""
        high = df['high']
        low = df['low']
        close = df['close']

        # ATR (Average True Range)
        tr1 = high - low
        tr2 = abs(high - close.shift(1))
        tr3 = abs(low - close.shift(1))
        true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        df['atr'] = true_range.rolling(window=self.vol_lookback).mean()

        # ATR as percentage of price
        df['atr_pct'] = df['atr'] / close

        # Historical volatility (standard deviation of returns)
        returns = close.pct_change()
        df['hist_vol'] = returns.rolling(
            window=self.vol_lookback).std() * np.sqrt(252)
        df['hist_vol_long'] = returns.rolling(
            window=self.vol_long_lookback).std() * np.sqrt(252)

        # Volatility ratio (current vs long-term)
        df['vol_ratio'] = df['hist_vol'] / df['hist_vol_long']

        # Rolling percentile of current volatility
        df['vol_percentile'] = df['hist_vol'].rolling(
            window=self.vol_long_lookback
        ).apply(lambda x: (x[-1] > x).mean() * 100 if len(x) > 1 else 50, raw=True)

        return df

    def _calculate_momentum_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate momentum-related indicators"""
        close = df['close']

        # RSI
        delta = close.diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)

        avg_gain = gain.rolling(window=self.momentum_period).mean()
        avg_loss = loss.rolling(window=self.momentum_period).mean()

        rs = avg_gain / avg_loss.replace(0, np.nan)
        df['rsi'] = 100 - (100 / (1 + rs))

        # RSI divergence from price trend
        price_trend = close.pct_change(self.momentum_period)
        rsi_trend = df['rsi'].diff(self.momentum_period)
        df['rsi_divergence'] = np.sign(price_trend) != np.sign(rsi_trend)

        # Momentum (rate of change)
        df['momentum'] = close.pct_change(self.momentum_period)
        df['momentum_accel'] = df['momentum'].diff(5)

        # MACD for momentum confirmation
        ema12 = close.ewm(span=12).mean()
        ema26 = close.ewm(span=26).mean()
        df['macd'] = ema12 - ema26
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_hist'] = df['macd'] - df['macd_signal']

        return df

    def _classify_trend(self, row: pd.Series) -> str:
        """Classify trend regime for a single row"""
        try:
            ma_alignment = row.get('ma_alignment', 0.5)
            price_vs_slow = row.get('price_vs_slow', 0)
            ma_slow_slope = row.get('ma_slow_slope', 0)

            # Strong bull: aligned MAs + price above + positive slope
            if (ma_alignment > 0.66 and
                price_vs_slow > self.trend_threshold and
                    ma_slow_slope > 0):
                return 'bull'

            # Strong bear: inverted MAs + price below + negative slope
            elif (ma_alignment < 0.33 and
                  price_vs_slow < -self.trend_threshold and
                  ma_slow_slope < 0):
                return 'bear'

            # Sideways: mixed signals
            else:
                return 'sideways'

        except (KeyError, TypeError):
            return 'sideways'

    def _classify_volatility(self, row: pd.Series) -> str:
        """Classify volatility regime for a single row"""
        try:
            vol_percentile = row.get('vol_percentile', 50)

            if pd.isna(vol_percentile):
                return 'normal'

            if vol_percentile < self.vol_low_pct:
                return 'low'
            elif vol_percentile > self.vol_high_pct:
                return 'high'
            else:
                return 'normal'

        except (KeyError, TypeError):
            return 'normal'

    def _classify_momentum(self, row: pd.Series) -> str:
        """Classify momentum regime for a single row"""
        try:
            rsi = row.get('rsi', 50)
            momentum = row.get('momentum', 0)
            rsi_divergence = row.get('rsi_divergence', False)
            macd_hist = row.get('macd_hist', 0)

            if pd.isna(rsi):
                return 'weak'

            # Check for divergence (potential reversal)
            if rsi_divergence and (rsi > 70 or rsi < 30):
                return 'reversal'

            # Strong up momentum
            if rsi > 60 and momentum > 0.02 and macd_hist > 0:
                return 'strong_up'

            # Strong down momentum
            elif rsi < 40 and momentum < -0.02 and macd_hist < 0:
                return 'strong_down'

            # Weak/consolidating
            else:
                return 'weak'

        except (KeyError, TypeError):
            return 'weak'

    def _calculate_composite_score(self, df: pd.DataFrame) -> pd.Series:
        """
        Calculate composite regime score from -1 (bearish) to +1 (bullish).

        Combines trend, volatility context, and momentum.
        """
        # Trend component (40% weight)
        trend_score = df['ma_alignment'] * 2 - 1  # Convert 0-1 to -1 to +1

        # Momentum component (40% weight)
        rsi_normalized = (df['rsi'] - 50) / 50  # Convert 0-100 to -1 to +1
        # Clip and scale
        momentum_normalized = df['momentum'].clip(-0.1, 0.1) * 10
        momentum_score = (rsi_normalized + momentum_normalized) / 2

        # Volatility adjustment (20% weight) - high vol reduces confidence
        vol_adjustment = 1 - (df['vol_percentile'].fillna(50) / 100) * 0.5

        composite = (
            0.4 * trend_score +
            0.4 * momentum_score * vol_adjustment +
            0.2 * df['price_vs_slow'].clip(-0.1, 0.1) * 10
        )

        return composite.clip(-1, 1)

    def get_regime_statistics(self, df: pd.DataFrame) -> Dict:
        """
        Get statistics about regime distribution in the dataset.

        Returns:
            Dictionary with regime counts and percentages
        """
        stats = {
            'trend_distribution': df['trend_regime'].value_counts(normalize=True).to_dict(),
            'volatility_distribution': df['volatility_regime'].value_counts(normalize=True).to_dict(),
            'momentum_distribution': df['momentum_regime'].value_counts(normalize=True).to_dict(),
            'avg_regime_score': df['regime_score'].mean(),
            'regime_score_std': df['regime_score'].std(),
            'total_samples': len(df)
        }

        # Regime transitions
        if 'trend_regime' in df.columns:
            transitions = (df['trend_regime'] !=
                           df['trend_regime'].shift(1)).sum()
            stats['trend_transitions'] = int(transitions)
            stats['avg_regime_duration'] = len(df) / max(transitions, 1)

        return stats

    def get_current_regime(self, df: pd.DataFrame) -> RegimeState:
        """
        Get the current (latest) regime state.

        Args:
            df: DataFrame with regime columns (must call detect_regimes first)

        Returns:
            RegimeState object for the most recent observation
        """
        if df.empty:
            return RegimeState(
                trend=TrendRegime.SIDEWAYS,
                volatility=VolatilityRegime.NORMAL,
                momentum=MomentumRegime.WEAK,
                composite_score=0.0
            )

        latest = df.iloc[-1]

        return RegimeState(
            trend=TrendRegime(latest.get('trend_regime', 'sideways')),
            volatility=VolatilityRegime(
                latest.get('volatility_regime', 'normal')),
            momentum=MomentumRegime(latest.get('momentum_regime', 'weak')),
            composite_score=float(latest.get('regime_score', 0.0))
        )

    def filter_by_regime(
        self,
        df: pd.DataFrame,
        trend: Optional[str] = None,
        volatility: Optional[str] = None,
        momentum: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Filter dataframe to specific regime conditions.

        Args:
            df: DataFrame with regime columns
            trend: 'bull', 'bear', or 'sideways'
            volatility: 'low', 'normal', or 'high'
            momentum: 'strong_up', 'strong_down', 'weak', or 'reversal'

        Returns:
            Filtered DataFrame
        """
        mask = pd.Series(True, index=df.index)

        if trend:
            mask &= df['trend_regime'] == trend
        if volatility:
            mask &= df['volatility_regime'] == volatility
        if momentum:
            mask &= df['momentum_regime'] == momentum

        return df[mask]

    def evaluate_by_regime(
        self,
        df: pd.DataFrame,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict:
        """
        Evaluate model performance broken down by regime.

        Returns:
            Dictionary with accuracy per regime combination
        """
        df = df.copy()
        df['y_true'] = y_true
        df['y_pred'] = y_pred
        df['correct'] = df['y_true'] == df['y_pred']

        results = {}

        # Performance by trend regime
        for regime in ['bull', 'bear', 'sideways']:
            subset = df[df['trend_regime'] == regime]
            if len(subset) > 0:
                results[f'trend_{regime}_accuracy'] = subset['correct'].mean()
                results[f'trend_{regime}_count'] = len(subset)

        # Performance by volatility regime
        for regime in ['low', 'normal', 'high']:
            subset = df[df['volatility_regime'] == regime]
            if len(subset) > 0:
                results[f'vol_{regime}_accuracy'] = subset['correct'].mean()
                results[f'vol_{regime}_count'] = len(subset)

        # Overall
        results['overall_accuracy'] = df['correct'].mean()
        results['total_samples'] = len(df)

        return results
