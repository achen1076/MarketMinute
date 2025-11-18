# Quantitative Trading System

ML trading system for daily stock trading using LightGBM and advanced feature engineering.

## Quick Start

```bash
# Setup
pip install -r requirements.txt
python3 scripts/setup_schwab_auth.py

# Data & Training
python3 scripts/prep_data.py
python3 scripts/train_model.py

# Backtesting
python3 backtest/backtest.py
python3 backtest/backtest_multi_year.py

# Paper Trading
python3 paper_trading/paper_trade.py --refresh-data
streamlit run dashboards/paper_trading_dashboard.py
```

## What It Does

1. Fetches data from Schwab API (daily bars)
2. Engineers 50+ technical features
3. Labels data with triple-barrier method
4. Trains LightGBM classifier
5. Validates with walk-forward cross-validation
6. Backtests and paper trades

## Performance

2024 YTD backtest results:
- **Return:** +129% (portfolio)
- **Win Rate:** 54.3%
- **Sharpe Ratio:** 3.40
- **Max Drawdown:** -17.9%

## Structure

```
backtest/          # Backtesting
paper_trading/     # Live paper trading
dashboards/        # Visualization
scripts/           # Utilities
src/               # Core library
data/              # Data storage
outputs/           # Models & results
```

See [STRUCTURE.md](STRUCTURE.md) for details.

## Configuration

Edit `SYSTEM_SPEC.yaml` to customize:
- Tickers to trade
- Feature parameters
- TP/SL multipliers
- Risk management settings
- Walk-forward CV windows

## Key Features

- Triple-barrier labeling (TP/SL/timeout)
- 50+ engineered features
- Walk-forward cross-validation
- ATR-based stop loss & position sizing
- Realistic execution costs
- Automated backtesting
- Live paper trading

## Dashboards

**Paper Trading:**
```bash
streamlit run dashboards/paper_trading_dashboard.py
```

**Predictions:**
```bash
streamlit run dashboards/prediction_dashboard.py
```

## Output Files

- `outputs/models/*.pkl` - Trained models
- `outputs/backtests/*.csv` - Backtest results
- `data/paper_trading/*.csv` - Paper trading state

## Notes

- Confidence threshold: 64%
- Position size: 10% per trade
- Stop loss: 1.5x ATR
- Take profit: 2.5x ATR
- Risk/Reward: ~1.67:1
