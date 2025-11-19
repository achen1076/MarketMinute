"""
Three-class labels for quant models.

Labels:
    -1 = strong down
     0 = neutral
     1 = strong up

Supports:
    • Fixed threshold
    • Volatility-adjusted dynamic threshold
    • Density control (limit strong-move ratio)

Safe for 20 years of daily data.
"""

import numpy as np
import pandas as pd


class MultiClassLabeler:
    def __init__(
        self,
        forward_periods=5,
        neutral_threshold_pct=0.01,
        strong_threshold_pct=0.025,
        dynamic_vol=True,
        vol_window=30,
        neutral_vol_scale=0.8,
        strong_vol_scale=2.0,
        max_strong_ratio=0.12,
        mode='strong_moves',
    ):
        self.forward_periods = forward_periods
        self.neutral_threshold_pct = neutral_threshold_pct
        self.strong_threshold_pct = strong_threshold_pct
        self.dynamic_vol = dynamic_vol
        self.vol_window = vol_window
        self.neutral_vol_scale = neutral_vol_scale
        self.strong_vol_scale = strong_vol_scale
        self.max_strong_ratio = max_strong_ratio
        self.mode = mode

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df["forward_ret"] = df["close"].shift(
            -self.forward_periods) / df["close"] - 1
        df["return_at_label"] = df["forward_ret"]

        if self.dynamic_vol:
            df["rolling_vol"] = df["close"].pct_change().rolling(
                self.vol_window).std()
            df["neutral_thresh"] = df["rolling_vol"] * self.neutral_vol_scale
            df["strong_thresh"] = df["rolling_vol"] * self.strong_vol_scale
            neutral_thresh = df["neutral_thresh"]
            strong_thresh = df["strong_thresh"]
        else:
            neutral_thresh = self.neutral_threshold_pct
            strong_thresh = self.strong_threshold_pct

        df["label"] = 0
        df.loc[df["forward_ret"] >= strong_thresh, "label"] = 1
        df.loc[df["forward_ret"] <= -strong_thresh, "label"] = -1
        df.loc[df["forward_ret"].abs() < neutral_thresh, "label"] = 0

        strong_mask = df["label"].abs() == 1
        strong_ratio = strong_mask.mean()
        if strong_ratio > self.max_strong_ratio:
            keep_n = int(len(df) * self.max_strong_ratio)
            idx_strong = df[strong_mask].sample(keep_n, random_state=42).index
            df.loc[strong_mask & (~df.index.isin(idx_strong)), "label"] = 0

        df = df.dropna().reset_index(drop=True)
        return df
