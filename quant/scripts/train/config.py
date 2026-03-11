"""Training pipeline configuration constants."""

FORWARD_PERIODS = 5
MAX_FEATURES = 20
VOL_NORMALIZE = True

EXCLUDE_COLS = [
    "timestamp", "open", "high", "low", "close", "volume", "ticker",
    "label", "forward_ret", "return_at_label",
    "rolling_vol", "neutral_thresh", "strong_thresh", "dyn_thresh",
    "trend_regime", "volatility_regime", "momentum_regime",
    "ma_fast", "ma_slow", "ma_long", "ma_fast_slope", "ma_slow_slope",
    "price_vs_fast", "price_vs_slow", "price_vs_long", "ma_alignment",
    "atr", "atr_pct", "hist_vol", "hist_vol_long", "vol_ratio", "vol_percentile",
    "rsi", "rsi_divergence", "momentum", "momentum_accel",
    "macd", "macd_signal", "macd_hist"
]

REGIME_FEATURE_COLS = [
    "regime_score", "trend_regime_num",
    "volatility_regime_num", "momentum_regime_num"
]
