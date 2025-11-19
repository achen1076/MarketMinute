"""
A clean, fast, production-grade feature generator for
financial time series.

Features are grouped into:
    • Price-based
    • Momentum
    • Volatility
    • Volume
    • Statistical ratios

All features avoid lookahead bias and handle NaNs safely.
"""

import numpy as np
import pandas as pd


class FeatureEngine:
    """
    Generate all features used by the quant model.

    Usage:
        fe = FeatureEngine()
        df = fe.calculate_all(df)
    """

    def __init__(self):
        pass

    # ==========================================================
    # Utility
    # ==========================================================
    def _safe_pct(self, s):
        """Prevent divide-by-zero instability."""
        return s.pct_change().replace([np.inf, -np.inf], np.nan)

    def _roll(self, s, window, func="mean"):
        """Safe rolling window helper."""
        if func == "mean":
            return s.rolling(window).mean()
        if func == "std":
            return s.rolling(window).std()
        if func == "min":
            return s.rolling(window).min()
        if func == "max":
            return s.rolling(window).max()

    def _price_features(self, df):
        df["return_1d"] = self._safe_pct(df["close"])
        df["high_low_spread"] = (df["high"] - df["low"]) / df["close"]
        df["close_open_spread"] = (df["close"] - df["open"]) / df["open"]
        return df
    
    def _lag_features(self, df):
        df["prev_close_return"] = df["close"].pct_change().shift(1)
        df["prev_body"] = ((df["close"] - df["open"]) / df["open"]).shift(1)
        df["prev_range"] = ((df["high"] - df["low"]) / df["open"]).shift(1)
        df["prev_volume_chg"] = df["volume"].pct_change().shift(1)
        prev_hl_range = df["high"].shift(1) - df["low"].shift(1)
        df["prev_close_position"] = (
            (df["close"].shift(1) - df["low"].shift(1)) / prev_hl_range
        ).replace([np.inf, -np.inf], np.nan)
        return df

    def _momentum_features(self, df):
        for w in [3, 5, 10, 20]:
            df[f"mom_{w}"] = df["close"].pct_change(w)
            df[f"roc_{w}"] = df["close"] / df["close"].shift(w) - 1
            df[f"ema_ratio_{w}"] = df["close"] / \
                df["close"].ewm(span=w).mean() - 1
        return df

    def _volatility_features(self, df):
        for w in [5, 10, 20]:
            df[f"vol_{w}"] = df["return_1d"].rolling(w).std()
            df[f"range_vol_{w}"] = (df["high"] - df["low"]).rolling(w).std()
        return df

    def _volume_features(self, df):
        df["volume_z"] = (
            df["volume"] - df["volume"].rolling(20).mean()) / df["volume"].rolling(20).std()
        df["vol_chg"] = df["volume"].pct_change()
        for w in [5, 20]:
            df[f"vol_sma_ratio_{w}"] = df["volume"] / \
                df["volume"].rolling(w).mean() - 1
        return df

    def _stat_features(self, df):
        for w in [5, 10, 20]:
            df[f"zscore_{w}"] = (
                df["close"] - df["close"].rolling(w).mean()) / df["close"].rolling(w).std()
            df[f"minmax_{w}"] = (df["close"] - df["close"].rolling(w).min()) / (
                df["close"].rolling(w).max() - df["close"].rolling(w).min()
            )
        return df

    def calculate_all(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df.sort_values("timestamp")

        df = self._price_features(df)
        df = self._lag_features(df)
        df = self._momentum_features(df)
        df = self._volatility_features(df)
        df = self._volume_features(df)
        df = self._stat_features(df)

        df = df.dropna(axis=1, how="all")
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.dropna().reset_index(drop=True)

        return df
