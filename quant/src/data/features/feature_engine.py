"""
A clean, fast, production-grade feature generator for
financial time series.

Features are grouped into:
    • Price-based
    • Momentum
    • Volatility
    • Volume
    • Statistical ratios
    • Autocorrelation
    • Mean reversion
    • Candle patterns
    • Relative strength

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

    def _safe_div(self, a, b):
        """Safe division handling zeros."""
        return np.where(b != 0, a / b, 0)

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
        df["upper_shadow"] = (
            df["high"] - df[["open", "close"]].max(axis=1)) / df["close"]
        df["lower_shadow"] = (df[["open", "close"]].min(
            axis=1) - df["low"]) / df["close"]
        df["body_size"] = abs(df["close"] - df["open"]) / df["close"]
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

        for lag in [2, 3, 5]:
            df[f"return_lag_{lag}"] = df["return_1d"].shift(lag)
        return df

    def _momentum_features(self, df):
        for w in [3, 5, 10, 20]:
            df[f"mom_{w}"] = df["close"].pct_change(w)
            df[f"roc_{w}"] = df["close"] / df["close"].shift(w) - 1
            df[f"ema_ratio_{w}"] = df["close"] / \
                df["close"].ewm(span=w).mean() - 1

        df["rsi_14"] = self._calculate_rsi(df["close"], 14)
        df["rsi_7"] = self._calculate_rsi(df["close"], 7)

        df["stoch_k"] = self._calculate_stochastic(df, 14)
        df["stoch_d"] = df["stoch_k"].rolling(3).mean()

        ema12 = df["close"].ewm(span=12).mean()
        ema26 = df["close"].ewm(span=26).mean()
        df["macd_line"] = ema12 - ema26
        df["macd_signal"] = df["macd_line"].ewm(span=9).mean()
        df["macd_hist"] = df["macd_line"] - df["macd_signal"]
        df["macd_hist_slope"] = df["macd_hist"].diff(3)

        df["williams_r"] = self._calculate_williams_r(df, 14)

        df["momentum_divergence"] = (
            np.sign(df["close"].pct_change(10)) !=
            np.sign(df["rsi_14"].diff(10))
        ).astype(int)

        return df

    def _calculate_rsi(self, prices, period):
        """Calculate RSI indicator."""
        delta = prices.diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(window=period).mean()
        avg_loss = loss.rolling(window=period).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        return 100 - (100 / (1 + rs))

    def _calculate_stochastic(self, df, period):
        """Calculate Stochastic %K."""
        low_min = df["low"].rolling(window=period).min()
        high_max = df["high"].rolling(window=period).max()
        return 100 * (df["close"] - low_min) / (high_max - low_min).replace(0, np.nan)

    def _calculate_williams_r(self, df, period):
        """Calculate Williams %R."""
        high_max = df["high"].rolling(window=period).max()
        low_min = df["low"].rolling(window=period).min()
        return -100 * (high_max - df["close"]) / (high_max - low_min).replace(0, np.nan)

    def _volatility_features(self, df):
        for w in [5, 10, 20]:
            df[f"vol_{w}"] = df["return_1d"].rolling(w).std()
            df[f"range_vol_{w}"] = (df["high"] - df["low"]).rolling(w).std()

        df["atr_14"] = self._calculate_atr(df, 14)
        df["atr_pct"] = df["atr_14"] / df["close"]

        df["vol_ratio"] = df["vol_5"] / df["vol_20"].replace(0, np.nan)

        df["bb_upper"], df["bb_lower"], df["bb_width"] = self._calculate_bollinger(
            df, 20, 2)
        df["bb_position"] = (df["close"] - df["bb_lower"]) / \
            (df["bb_upper"] - df["bb_lower"]).replace(0, np.nan)

        df["keltner_upper"], df["keltner_lower"] = self._calculate_keltner(
            df, 20, 2)
        df["squeeze"] = ((df["bb_upper"] < df["keltner_upper"]) &
                         (df["bb_lower"] > df["keltner_lower"])).astype(int)

        df["vol_percentile"] = df["vol_20"].rolling(60).apply(
            lambda x: (x[-1] > x).mean() * 100 if len(x) > 1 else 50, raw=True
        )

        return df

    def _calculate_atr(self, df, period):
        """Calculate Average True Range."""
        tr1 = df["high"] - df["low"]
        tr2 = abs(df["high"] - df["close"].shift(1))
        tr3 = abs(df["low"] - df["close"].shift(1))
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        return tr.rolling(window=period).mean()

    def _calculate_bollinger(self, df, period, std_dev):
        """Calculate Bollinger Bands."""
        sma = df["close"].rolling(window=period).mean()
        std = df["close"].rolling(window=period).std()
        upper = sma + (std * std_dev)
        lower = sma - (std * std_dev)
        width = (upper - lower) / sma
        return upper, lower, width

    def _calculate_keltner(self, df, period, multiplier):
        """Calculate Keltner Channels."""
        ema = df["close"].ewm(span=period).mean()
        atr = self._calculate_atr(df, period)
        upper = ema + (atr * multiplier)
        lower = ema - (atr * multiplier)
        return upper, lower

    def _volume_features(self, df):
        df["volume_z"] = (
            df["volume"] - df["volume"].rolling(20).mean()) / df["volume"].rolling(20).std()
        df["vol_chg"] = df["volume"].pct_change()
        for w in [5, 20]:
            df[f"vol_sma_ratio_{w}"] = df["volume"] / \
                df["volume"].rolling(w).mean() - 1

        df["obv"] = (np.sign(df["close"].diff()) * df["volume"]).cumsum()
        df["obv_slope"] = df["obv"].pct_change(5)

        df["vwap_ratio"] = df["close"] / self._calculate_vwap(df, 20)

        df["volume_trend"] = df["volume"].rolling(
            5).mean() / df["volume"].rolling(20).mean() - 1

        df["price_volume_corr"] = df["close"].pct_change().rolling(
            20).corr(df["volume"].pct_change())

        return df

    def _calculate_vwap(self, df, period):
        """Calculate rolling VWAP."""
        typical_price = (df["high"] + df["low"] + df["close"]) / 3
        return (typical_price * df["volume"]).rolling(period).sum() / df["volume"].rolling(period).sum()

    def _stat_features(self, df):
        for w in [5, 10, 20]:
            df[f"zscore_{w}"] = (
                df["close"] - df["close"].rolling(w).mean()) / df["close"].rolling(w).std()
            df[f"minmax_{w}"] = (df["close"] - df["close"].rolling(w).min()) / (
                df["close"].rolling(w).max() - df["close"].rolling(w).min()
            )
        return df

    def _autocorrelation_features(self, df):
        """Return autocorrelation features - predictive for mean reversion."""
        returns = df["return_1d"]

        for lag in [1, 2, 5, 10]:
            df[f"autocorr_{lag}"] = returns.rolling(20).apply(
                lambda x: x.autocorr(lag=lag) if len(x) > lag else 0, raw=False
            )

        df["return_streak"] = self._calculate_streak(returns)

        df["hurst"] = returns.rolling(100).apply(
            self._estimate_hurst, raw=True)

        return df

    def _calculate_streak(self, returns):
        """Calculate consecutive up/down day streak."""
        signs = np.sign(returns)
        streak = pd.Series(0, index=returns.index)
        current_streak = 0
        prev_sign = 0

        for i, sign in enumerate(signs):
            if pd.isna(sign):
                streak.iloc[i] = 0
                continue
            if sign == prev_sign:
                current_streak += sign
            else:
                current_streak = sign
            streak.iloc[i] = current_streak
            prev_sign = sign

        return streak

    def _estimate_hurst(self, ts):
        """Estimate Hurst exponent (mean reversion indicator)."""
        if len(ts) < 20 or np.std(ts) == 0:
            return 0.5

        lags = range(2, min(20, len(ts) // 2))
        tau = []
        for lag in lags:
            tau.append(np.std(np.subtract(ts[lag:], ts[:-lag])))

        if len(tau) < 2 or any(t == 0 for t in tau):
            return 0.5

        try:
            reg = np.polyfit(np.log(list(lags)), np.log(tau), 1)
            return reg[0]
        except:
            return 0.5

    def _mean_reversion_features(self, df):
        """Features indicating mean reversion potential."""
        for w in [5, 10, 20]:
            sma = df["close"].rolling(w).mean()
            df[f"dist_from_sma_{w}"] = (df["close"] - sma) / sma

        df["dist_from_52w_high"] = df["close"] / \
            df["close"].rolling(252).max() - 1
        df["dist_from_52w_low"] = df["close"] / \
            df["close"].rolling(252).min() - 1

        df["gap"] = (df["open"] - df["close"].shift(1)) / df["close"].shift(1)
        df["gap_fill_potential"] = -df["gap"]

        df["mean_reversion_signal"] = -df["zscore_20"] * \
            (1 - df["vol_ratio"].clip(0, 2))

        return df

    def _candle_pattern_features(self, df):
        """Candlestick pattern recognition."""
        body = df["close"] - df["open"]
        body_abs = abs(body)
        upper_wick = df["high"] - df[["open", "close"]].max(axis=1)
        lower_wick = df[["open", "close"]].min(axis=1) - df["low"]
        total_range = df["high"] - df["low"]

        df["doji"] = (body_abs / total_range.replace(0, np.nan)
                      < 0.1).astype(int)

        df["hammer"] = (
            (lower_wick > 2 * body_abs) &
            (upper_wick < body_abs * 0.5) &
            (body > 0)
        ).astype(int)

        df["shooting_star"] = (
            (upper_wick > 2 * body_abs) &
            (lower_wick < body_abs * 0.5) &
            (body < 0)
        ).astype(int)

        prev_body = body.shift(1)
        df["engulfing_bull"] = (
            (prev_body < 0) &
            (body > 0) &
            (df["open"] < df["close"].shift(1)) &
            (df["close"] > df["open"].shift(1))
        ).astype(int)

        df["engulfing_bear"] = (
            (prev_body > 0) &
            (body < 0) &
            (df["open"] > df["close"].shift(1)) &
            (df["close"] < df["open"].shift(1))
        ).astype(int)

        df["inside_bar"] = (
            (df["high"] < df["high"].shift(1)) &
            (df["low"] > df["low"].shift(1))
        ).astype(int)

        df["outside_bar"] = (
            (df["high"] > df["high"].shift(1)) &
            (df["low"] < df["low"].shift(1))
        ).astype(int)

        return df

    def _relative_strength_features(self, df):
        """Relative strength and trend strength features."""
        for w in [5, 10, 20, 50]:
            up_days = (df["return_1d"] > 0).rolling(w).sum()
            df[f"up_ratio_{w}"] = up_days / w

        df["adx"] = self._calculate_adx(df, 14)

        avg_gain = df["return_1d"].clip(lower=0).rolling(10).mean()
        avg_loss = (-df["return_1d"].clip(upper=0)).rolling(10).mean()
        df["gain_loss_ratio"] = avg_gain / avg_loss.replace(0, np.nan)

        ema_fast = df["close"].ewm(span=12).mean()
        ema_slow = df["close"].ewm(span=26).mean()
        df["trend_strength"] = (ema_fast - ema_slow) / ema_slow

        return df

    def _calculate_adx(self, df, period):
        """Calculate Average Directional Index."""
        high = df["high"]
        low = df["low"]
        close = df["close"]

        plus_dm = high.diff()
        minus_dm = -low.diff()
        plus_dm[plus_dm < 0] = 0
        minus_dm[minus_dm < 0] = 0

        tr = self._calculate_atr(df, 1) * period

        plus_di = 100 * (plus_dm.rolling(period).sum() / tr.replace(0, np.nan))
        minus_di = 100 * (minus_dm.rolling(period).sum() /
                          tr.replace(0, np.nan))

        dx = 100 * abs(plus_di - minus_di) / \
            (plus_di + minus_di).replace(0, np.nan)
        adx = dx.rolling(period).mean()

        return adx

    def calculate_all(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df.sort_values("timestamp")

        df = self._price_features(df)
        df = self._lag_features(df)
        df = self._momentum_features(df)
        df = self._volatility_features(df)
        df = self._volume_features(df)
        df = self._stat_features(df)
        df = self._autocorrelation_features(df)
        df = self._mean_reversion_features(df)
        df = self._candle_pattern_features(df)
        df = self._relative_strength_features(df)

        df = df.dropna(axis=1, how="all")
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.dropna().reset_index(drop=True)

        return df
