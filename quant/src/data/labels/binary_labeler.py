"""
Binary directional labels for strong up / strong down moves.

Labels:
    1  = strong_up
    -1 = strong_down

Neutral (0) days are REMOVED entirely.
This creates a balanced dataset suitable for binary classification.
"""

import numpy as np
import pandas as pd


class BinaryLabeler:
    def __init__(
        self,
        forward_periods=5,
        threshold_pct=0.015,
        dynamic_vol=False,
        vol_window=20,
        vol_scale=1.5,
        mode='strong_moves',
    ):
        self.forward_periods = forward_periods
        self.threshold_pct = threshold_pct
        self.dynamic_vol = dynamic_vol
        self.vol_window = vol_window
        self.vol_scale = vol_scale
        self.mode = mode

    # -------------------------------------------------
    # Label generator
    # -------------------------------------------------
    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        # Forward returns
        df["forward_ret"] = df["close"].shift(
            -self.forward_periods) / df["close"] - 1
        
        # Also store as return_at_label for compatibility
        df["return_at_label"] = df["forward_ret"]

        # Volatility-based dynamic threshold
        if self.dynamic_vol:
            df["rolling_vol"] = df["close"].pct_change().rolling(
                self.vol_window).std()
            df["dyn_thresh"] = df["rolling_vol"] * self.vol_scale

            thresh = df["dyn_thresh"]
        else:
            thresh = self.threshold_pct

        # Labels
        df["label"] = 0
        df.loc[df["forward_ret"] >= thresh, "label"] = 1
        df.loc[df["forward_ret"] <= -thresh, "label"] = -1

        # Remove neutral class entirely
        df = df[df["label"] != 0]

        df = df.dropna().reset_index(drop=True)
        return df
