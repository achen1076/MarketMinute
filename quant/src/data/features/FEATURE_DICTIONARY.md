# Feature Dictionary - Schema V2

**Version:** v2  
**Total Features:** 44  
**Last Updated:** November 12, 2025  

---

## Feature Categories

### 1. Returns (4 features)

| Feature | Description | Window | Calculation | Leakage Guard |
|---------|-------------|--------|-------------|---------------|
| `log_ret_1` | 1-bar log return | 1 bar lookback | `log(close_t / close_t-1)` | ✅ Uses only past close prices |
| `log_ret_3` | 3-bar log return | 3 bars lookback | `log(close_t / close_t-3)` | ✅ Uses only past close prices |
| `log_ret_5` | 5-bar log return | 5 bars lookback | `log(close_t / close_t-5)` | ✅ Uses only past close prices |
| `log_ret_15` | 15-bar log return | 15 bars lookback | `log(close_t / close_t-15)` | ✅ Uses only past close prices |

**Purpose:** Multi-horizon price momentum  
**Lookback Range:** 1-15 bars (30 min - 7.5 hours in 30-min data)  
**Leakage Risk:** ⚠️ LOW - Only uses historical closes  

---

### 2. Volatility (7 features)

| Feature | Description | Window | Calculation | Leakage Guard |
|---------|-------------|--------|-------------|---------------|
| `atr_14` | Average True Range | 14 bars | `EMA(max(H-L, H-C_prev, C_prev-L))` | ✅ Uses only completed bars |
| `realized_vol_10` | Realized volatility | 10 bars | `std(log_ret_1, window=10)` | ✅ Uses past returns only |
| `bb_upper` | Bollinger Band upper | 20 bars | `SMA(20) + 2×STD(20)` | ✅ Rolling window complete |
| `bb_middle` | Bollinger Band middle | 20 bars | `SMA(close, 20)` | ✅ Rolling window complete |
| `bb_lower` | Bollinger Band lower | 20 bars | `SMA(20) - 2×STD(20)` | ✅ Rolling window complete |
| `bb_width_20` | BB width (normalized) | 20 bars | `(bb_upper - bb_lower) / bb_middle` | ✅ Derived from safe features |
| `vol_zscore` | Volatility z-score | 50 bars | `(realized_vol - mean(50)) / std(50)` | ✅ Uses expanding window |

**Purpose:** Market volatility regime detection  
**Lookback Range:** 10-50 bars  
**Leakage Risk:** ⚠️ LOW - All windows use completed bars only  

---

### 3. Momentum (8 features)

| Feature | Description | Window | Calculation | Leakage Guard |
|---------|-------------|--------|-------------|---------------|
| `rsi_3` | RSI 3-period | 3 bars | `100 - 100/(1 + avg_gain/avg_loss)` | ✅ Rolling calculation |
| `rsi_7` | RSI 7-period | 7 bars | `100 - 100/(1 + avg_gain/avg_loss)` | ✅ Rolling calculation |
| `rsi_14` | RSI 14-period | 14 bars | `100 - 100/(1 + avg_gain/avg_loss)` | ✅ Rolling calculation |
| `macd_fast` | MACD line | 12, 26 bars | `EMA(12) - EMA(26)` | ✅ EMA uses past only |
| `macd_signal` | MACD signal | 9 bars | `EMA(macd_fast, 9)` | ✅ Derived from MACD |
| `kama_slope` | KAMA slope | 10 bars | `diff(KAMA(10))` | ✅ KAMA is adaptive |
| `mom_slope_5` | 5-bar momentum slope | 5 bars | `(close_t - close_t-5) / 5` | ✅ Uses past closes |
| `mom_slope_10` | 10-bar momentum slope | 10 bars | `(close_t - close_t-10) / 10` | ✅ Uses past closes |

**Purpose:** Trend and momentum measurement  
**Lookback Range:** 3-26 bars  
**Leakage Risk:** ⚠️ LOW - All indicators use standard formulas with past data  

---

### 4. Price Location (4 features)

| Feature | Description | Window | Calculation | Leakage Guard |
|---------|-------------|--------|-------------|---------------|
| `zscore_vs_vwap` | Price vs VWAP z-score | 20 bars | `(close - vwap) / std(vwap, 20)` | ✅ VWAP uses completed bars |
| `bb_position` | Position in BB channel | 20 bars | `(close - bb_lower) / (bb_upper - bb_lower)` | ✅ BB from past data |
| `dist_from_vwap_pct` | % distance from VWAP | 20 bars | `(close - vwap) / vwap` | ✅ VWAP cumulative |
| `dist_sma20` | % distance from SMA | 20 bars | `(close - SMA(20)) / SMA(20)` | ✅ SMA uses past |

**Purpose:** Mean reversion signals  
**Lookback Range:** 20 bars  
**Leakage Risk:** ⚠️ LOW - All relative to historical benchmarks  

---

### 5. Time Context (8 features)

| Feature | Description | Window | Calculation | Leakage Guard |
|---------|-------------|--------|-------------|---------------|
| `minute_sin` | Minute of day (sin) | N/A | `sin(2π × minute_of_day / 1440)` | ✅ Timestamp only |
| `minute_cos` | Minute of day (cos) | N/A | `cos(2π × minute_of_day / 1440)` | ✅ Timestamp only |
| `day_sin` | Day of week (sin) | N/A | `sin(2π × day / 7)` | ✅ Timestamp only |
| `day_cos` | Day of week (cos) | N/A | `cos(2π × day / 7)` | ✅ Timestamp only |
| `is_first_30min` | First 30min of day | N/A | `1 if 9:00-9:30 else 0` | ✅ Timestamp only |
| `is_last_30min` | Last 30min of day | N/A | `1 if 15:30-16:00 else 0` | ✅ Timestamp only |
| `is_open` | Market open period | N/A | `1 if 9:30-9:45 else 0` | ✅ Timestamp only |
| `is_close` | Market close period | N/A | `1 if 15:45-16:00 else 0` | ✅ Timestamp only |

**Purpose:** Time-of-day effects and session patterns  
**Lookback Range:** None (timestamp-derived)  
**Leakage Risk:** ✅ NONE - Based on timestamp only, no future information  

---

### 6. Liquidity (5 features)

| Feature | Description | Window | Calculation | Leakage Guard |
|---------|-------------|--------|-------------|---------------|
| `hl_range_pct` | High-low range % | 1 bar | `(high - low) / close` | ✅ Current bar OHLC |
| `volume_zscore` | Volume z-score | 20 bars | `(volume - mean(20)) / std(20)` | ✅ Rolling window |
| `spread_proxy` | Spread proxy | 1 bar | `hl_range_pct` | ✅ Same as hl_range |
| `dollar_volume_ma` | Dollar volume MA | 20 bars | `SMA(close × volume, 20)` | ✅ Rolling window |
| `volume_ratio` | Volume vs MA ratio | 20 bars | `volume / SMA(volume, 20)` | ✅ Current vs past |

**Purpose:** Liquidity and market depth proxies  
**Lookback Range:** 1-20 bars  
**Leakage Risk:** ⚠️ MEDIUM - Current bar OHLC used; ensure trading at next bar  

---

### 7. Regime (3 features)

| Feature | Description | Window | Calculation | Leakage Guard |
|---------|-------------|--------|-------------|---------------|
| `vol_regime` | Volatility regime | 100 bars min | `GMM(realized_vol, k=4).predict()` | ✅ Fitted on past data |
| `trend_regime` | Trend regime | 100 bars min | `GMM(momentum, k=4).predict()` | ✅ Fitted on past data |
| `liquidity_regime` | Liquidity regime | 100 bars min | `GMM(volume_zscore, k=4).predict()` | ✅ Fitted on past data |

**Purpose:** Market regime classification (high/low vol, trending/ranging, etc.)  
**Lookback Range:** Minimum 100 bars for stable clustering  
**Leakage Risk:** ⚠️ LOW - GMM fitted on expanding window  
**Note:** Regime labels may shift with retraining; use with caution  

---

## Leakage Prevention Guidelines

### ✅ Safe Patterns
1. **Rolling windows on past data**: `close.rolling(20).mean()`
2. **Shift operations**: `close.shift(1)` for previous bar
3. **Timestamp-derived features**: Hour, day-of-week
4. **Current bar OHLC** (if trading at next bar open)

### ⚠️ Risky Patterns (AVOIDED)
1. **Forward-looking windows**: `close.rolling(20, center=True)` ❌
2. **Future prices**: `close.shift(-1)` ❌
3. **Label-derived features**: Using `y` in `X` ❌
4. **Data leaks from resampling**: Ensure proper bar alignment ❌

### 🔒 Leakage Guards Implemented
- All rolling calculations use `.rolling()` with no `center=True`
- All shift operations use positive values (lookback only)
- VWAP is cumulative or rolling, never forward-looking
- GMM fitted on expanding window, not including current bar
- Time features use only timestamp, not future timestamps

---

## Feature Usage in Models

### Training
```python
# Exclude these from feature set:
exclude_cols = [
    'timestamp',           # Not a feature
    'ticker',             # Identifier only
    'label',              # Target variable
    'barrier_touched',    # Label metadata
    'bars_held',          # Label metadata
    'return_at_barrier',  # Label metadata
    
    # Intermediate calculations (not final features):
    'bb_std',             # Used to calculate bb_width
    'sma_20',             # Used to calculate dist_sma20
    'vwap',               # Used to calculate zscore_vs_vwap
    'dollar_volume',      # Used to calculate dollar_volume_ma
    'volume_ma',          # Used to calculate volume_ratio
    'kama'                # Used to calculate kama_slope
]

feature_cols = [col for col in df.columns if col not in exclude_cols]
```

### Validation
- Use walk-forward CV with 10-bar embargo
- Purge overlapping bars between train/test
- Never fit scaler/GMM on test data

---

## Feature Quality Checks

### At Training Time
```python
# 1. No NaN in features
assert X_train.isna().sum().sum() == 0

# 2. No inf values
assert not np.isinf(X_train.values).any()

# 3. No constant columns
assert X_train.nunique().min() > 1

# 4. No high correlation duplicates (>0.99)
corr = X_train.corr()
assert (corr.abs() > 0.99).sum().sum() - len(X_train.columns) < 5
```

### At Inference Time
```python
# 1. Schema validation
assert set(X_new.columns) == set(X_train.columns)

# 2. No extreme outliers (>10 std)
z_scores = np.abs((X_new - X_train.mean()) / X_train.std())
assert (z_scores > 10).sum().sum() < len(X_new) * 0.01  # <1% outliers

# 3. Distribution shift detection
from scipy.stats import ks_2samp
for col in X_new.columns:
    stat, pval = ks_2samp(X_train[col], X_new[col])
    if pval < 0.01:
        logger.warning(f"Distribution shift in {col}: p={pval:.4f}")
```

---

## Version History

### v2 (Current)
- **Date**: November 12, 2025
- **Features**: 44
- **Changes**: Initial institutional implementation
  - Added regime detection (GMM)
  - Added time-of-day features
  - Added multi-horizon returns
  - Implemented leakage guards

### v1 (Deprecated)
- **Date**: Previous retail system
- **Features**: ~15 basic TA indicators
- **Limitations**: No regime detection, no time context, potential leakage

---

## References

1. **Triple-Barrier Method**: De Prado, M.L. (2018). *Advances in Financial Machine Learning*
2. **Feature Engineering**: Guida, R. & Coqueret, G. (2020). *Machine Learning for Factor Investing*
3. **Leakage Prevention**: Kaufman, S. et al. (2012). "Leakage in Data Mining"
4. **Regime Detection**: Hamilton, J.D. (1989). "A New Approach to the Economic Analysis of Nonstationary Time Series"

---

## Maintenance

### When Adding New Features
1. Document in this file with:
   - Description
   - Window size
   - Calculation formula
   - Leakage guard verification
2. Update schema version in `schema.py`
3. Add to feature engine in `feature_engine.py`
4. Add tests in `tests/test_features.py`
5. Update `SCHEMA_V2` in `schema.py`

### When Removing Features
1. Increment minor version (v2.1, v2.2, etc.)
2. Mark as deprecated before removal
3. Maintain backward compatibility for 1 version
4. Update all documentation

---

**Last Reviewed:** November 12, 2025  
**Reviewed By:** Build System  
**Status:** ✅ Production Ready
