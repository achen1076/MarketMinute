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
    "macd", "macd_signal", "macd_hist",
    # Raw price/volume levels: non-stationary across 20y of history, and obv
    # (a cumsum) differs between training and the Lambda's 3y fetch window.
    # Stationary replacements: range_vol_pct_*, macd_pct, bb_position,
    # keltner_position, atr_pct, obv_slope.
    "bb_upper", "bb_lower", "keltner_upper", "keltner_lower", "obv",
    "macd_line", "atr_14",
    "range_vol_5", "range_vol_10", "range_vol_20", "range_vol_60", "range_vol_120",
    # Regime features come from RegimeDetector, which the inference Lambda
    # never runs — models that selected them failed at serve time.
    "regime_score", "trend_regime_num", "volatility_regime_num", "momentum_regime_num",
]
