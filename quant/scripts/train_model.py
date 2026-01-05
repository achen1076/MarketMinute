"""
Batch training pipeline for all tickers in SYSTEM_SPEC.yaml

Unified training pipeline for:
    - LightGBM
    - XGBoost
    - Ensemble (LGBM + XGB + optional LSTM/Transformer)
Supports both:
    • Binary classification  (-1, +1)
    • Multiclass classification (-1, 0, +1)

Applies:
    • Hybrid balancing (Mode A: soft oversampling)
    • Model-specific hyperparameter tuning (optional)
    • Deterministic time-series splits (no leakage)
    • Clean artifact saving: model, scaler, metadata

Usage:
    python3 scripts/train_model.py --model lgbm --labels multiclass
    python3 scripts/train_model.py --model ensemble --tune 
"""

import argparse
import os
import yaml
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from src.data.features.feature_engine import FeatureEngine
from src.data.labels.binary_labeler import BinaryLabeler
from src.data.labels.multiclass_labeler import MultiClassLabeler

from src.models.base.lgbm_classifier import LGBMClassifier
from src.models.base.xgb_classifier import XGBClassifier
from src.models.base.lgbm_return_predictor import LGBMReturnPredictor
from src.models.ensemble_classifier import QuantModel

from src.models.lgbm_hyperparameter_tuner import LightGBMHyperparameterTuner
from src.models.xgb_hyperparameter_tuner import XGBHyperparameterTuner
from src.models.regime_aware_tuner import RegimeAwareHyperparameterTuner, RegimeAwareXGBTuner
from src.models.lgbm_return_tuner import LGBMReturnTuner

from src.evaluation.financial_metrics import FinancialMetrics
from src.evaluation.regime_detector import RegimeDetector

FORWARD_PERIODS = 10


def hybrid_balance(X, y, multiplier=1.4):
    df = X.copy()
    df["label"] = y

    counts = df["label"].value_counts().to_dict()
    max_count = max(counts.values())

    combined = []
    for cls, cnt in counts.items():
        subset = df[df["label"] == cls]

        if cnt < max_count:
            repeat_factor = max(1, int((max_count / cnt - 1) * multiplier))
            oversampled = pd.concat([subset] * repeat_factor, axis=0)
            combined.append(oversampled)

        combined.append(subset)

    df_bal = pd.concat(combined, axis=0).sample(frac=1, random_state=42)
    return df_bal.drop(columns=["label"]), df_bal["label"].values


def load_dataset(ticker: str):
    file = Path(f"data/processed/{ticker.lower()}_processed.csv")
    if not file.exists():
        raise FileNotFoundError(f"No processed dataset found: {file}")

    df = pd.read_csv(file)
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Feature generation
    fe = FeatureEngine()
    df = fe.calculate_all(df)

    # Drop unusable rows
    df = df.replace([np.inf, -np.inf], np.nan).dropna()

    return df


def generate_labels(df, mode="multiclass"):
    if mode == "binary":
        labeler = BinaryLabeler(
            forward_periods=FORWARD_PERIODS,
            threshold_pct=0.02,
            mode="strong_moves"
        )
    else:
        labeler = MultiClassLabeler(
            forward_periods=FORWARD_PERIODS,
            neutral_threshold_pct=0.005,
            strong_threshold_pct=0.015,
            dynamic_vol=False,
            vol_window=FORWARD_PERIODS,
            neutral_vol_scale=0.8,
            strong_vol_scale=2.0,
            max_strong_ratio=0.15,
            mode="strong_moves"
        )

    df = labeler.fit_transform(df)
    return df


def time_split_with_embargo(X, y, forward_returns, embargo_periods=None):
    """
    Time-series split with embargo gap to prevent label leakage.

    The embargo drops samples at split boundaries where labels would
    "look into" the next period's data.

    Args:
        X: Features DataFrame
        y: Labels
        forward_returns: Forward returns array
        embargo_periods: Gap size (defaults to FORWARD_PERIODS)

    Returns:
        X_train, X_val, X_test, y_train, y_val, y_test, fwd_ret_train, fwd_ret_val, fwd_ret_test
    """
    if embargo_periods is None:
        embargo_periods = FORWARD_PERIODS

    n = len(X)

    # Split points: 64% train, 16% val, 20% test
    train_end = int(n * 0.64)
    val_end = int(n * 0.80)

    # Apply embargo: drop last `embargo_periods` from train before val starts
    # and drop last `embargo_periods` from val before test starts
    train_end_clean = train_end - embargo_periods
    val_start = train_end
    val_end_clean = val_end - embargo_periods
    test_start = val_end

    X_train = X.iloc[:train_end_clean]
    y_train = y.iloc[:train_end_clean]
    fwd_ret_train = forward_returns[:train_end_clean]

    X_val = X.iloc[val_start:val_end_clean]
    y_val = y.iloc[val_start:val_end_clean]
    fwd_ret_val = forward_returns[val_start:val_end_clean]

    X_test = X.iloc[test_start:]
    y_test = y.iloc[test_start:]
    fwd_ret_test = forward_returns[test_start:]

    return X_train, X_val, X_test, y_train, y_val, y_test, fwd_ret_train, fwd_ret_val, fwd_ret_test


def walk_forward_split(X, y, forward_returns, n_splits=5, min_train_size=0.4, embargo_periods=None):
    """
    Walk-forward validation with expanding training window.

    Each fold:
    - Training: All data from start up to fold boundary (minus embargo)
    - Test: Next chunk of data

    This simulates realistic model retraining over time.

    Args:
        X: Features DataFrame
        y: Labels Series
        forward_returns: Forward returns array
        n_splits: Number of test folds
        min_train_size: Minimum fraction of data for first training set
        embargo_periods: Gap between train and test (default: FORWARD_PERIODS)

    Yields:
        (X_train, X_test, y_train, y_test, fwd_ret_train, fwd_ret_test, fold_info)
    """
    if embargo_periods is None:
        embargo_periods = FORWARD_PERIODS

    n = len(X)
    min_train_idx = int(n * min_train_size)

    # Divide remaining data into n_splits test chunks
    test_chunk_size = (n - min_train_idx) // n_splits

    for fold in range(n_splits):
        # Test window for this fold
        test_start = min_train_idx + (fold * test_chunk_size)
        test_end = test_start + test_chunk_size if fold < n_splits - 1 else n

        # Train on all data before test (minus embargo)
        train_end = test_start - embargo_periods

        if train_end <= 0:
            continue

        X_train = X.iloc[:train_end]
        y_train = y.iloc[:train_end]
        fwd_ret_train = forward_returns[:train_end]

        X_test = X.iloc[test_start:test_end]
        y_test = y.iloc[test_start:test_end]
        fwd_ret_test = forward_returns[test_start:test_end]

        fold_info = {
            "fold": fold + 1,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "train_end_idx": train_end,
            "test_start_idx": test_start,
            "embargo_gap": embargo_periods
        }

        yield X_train, X_test, y_train, y_test, fwd_ret_train, fwd_ret_test, fold_info


def time_split(X, y):
    """Legacy function - use time_split_with_embargo instead"""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, shuffle=False
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.20, shuffle=False
    )
    return X_train, X_val, X_test, y_train, y_val, y_test


def train_model(
    model_type,
    X_train, y_train,
    X_val, y_val,
    use_tuning=False,
    regime_labels_val=None,
    adaptive_threshold=None
):
    if model_type == "lgbm":
        if use_tuning:
            if regime_labels_val is not None:
                tuner = RegimeAwareHyperparameterTuner(
                    n_trials=40, regime_weight=0.6)
                params = tuner.tune(X_train, y_train, X_val,
                                    y_val, regime_labels_val)
            else:
                tuner = LightGBMHyperparameterTuner(n_trials=40)
                params = tuner.tune(X_train, y_train, X_val, y_val)
        else:
            params = None

        model = LGBMClassifier(params=params)
        model.fit(X_train, y_train, X_val, y_val)
        return model

    elif model_type == "xgb":
        if use_tuning:
            if regime_labels_val is not None:
                tuner = RegimeAwareXGBTuner(n_trials=40, regime_weight=0.6)
                params = tuner.tune(X_train, y_train, X_val,
                                    y_val, regime_labels_val)
            else:
                tuner = XGBHyperparameterTuner(n_trials=40)
                params = tuner.tune(X_train, y_train, X_val, y_val)
        else:
            params = None

        model = XGBClassifier(params=params)
        model.fit(X_train, y_train, X_val, y_val)
        return model

    elif model_type == "return":
        if use_tuning:
            tuner = LGBMReturnTuner(
                n_trials=30,
                forward_periods=FORWARD_PERIODS,
                transaction_cost_bps=10.0
            )
            best_params, threshold_scale = tuner.tune(
                X_train, y_train, X_val, y_val)
            model = LGBMReturnPredictor()
            model.params.update(best_params)
            model.threshold_scale = threshold_scale
        else:
            model = LGBMReturnPredictor()
            model.threshold_scale = 0.5  # Default
        model.fit(X_train, y_train, X_val, y_val)
        return model

    elif model_type == "ensemble":
        model = QuantModel(
            use_lgbm=True,
            use_xgboost=True,
            use_lstm=False,
            use_transformer=False,
            use_tuning=False,
            strategy="weighted",
            weight_power=2.0
        )
        model.fit(X_train, y_train, X_val, y_val)
        return model

    else:
        raise ValueError(f"Unknown model type: {model_type}")


def save_artifact(model, ticker, model_type, metrics=None):
    out_dir = Path("models") / model_type
    out_dir.mkdir(parents=True, exist_ok=True)

    filename = out_dir / f"{ticker}_{model_type}.pkl"

    with open(filename, "wb") as f:
        pickle.dump(model, f)

    print(f"\n💾 Saved model → {filename}\n")

    if metrics:
        save_model_metadata(ticker, model_type, metrics)


def save_model_metadata(ticker, model_type, metrics):
    import json

    metadata_file = Path("models") / "model_metadata.json"

    if metadata_file.exists():
        try:
            with open(metadata_file, 'r') as f:
                all_metadata = json.load(f)
        except json.JSONDecodeError:
            all_metadata = {"models": {}, "last_updated": None}
    else:
        all_metadata = {"models": {}, "last_updated": None}

    def to_native(val):
        if hasattr(val, 'item'):
            return val.item()
        return val

    pf = to_native(metrics.get('profit_factor', 0))
    if pf == float('inf') or pf == float('-inf') or (pf is not None and np.isnan(pf)):
        pf = None

    sharpe = round(float(to_native(metrics.get('sharpe_ratio', 0))), 2)
    pf_value = round(float(pf), 2) if pf is not None else None

    is_deployable = (
        sharpe > 1.0 and
        pf_value is not None and
        pf_value > 1.5
    )

    if is_deployable and sharpe > 5.0 and (pf_value or 0) > 3.0:
        quality_tier = "excellent"
    elif is_deployable:
        quality_tier = "good"
    elif pf_value and pf_value > 1.0:
        quality_tier = "marginal"
    elif not sharpe and not pf_value:
        quality_tier = "neutral"
    else:
        quality_tier = "poor"

    model_key = f"{ticker}_{model_type}"
    all_metadata["models"][model_key] = {
        "ticker": ticker,
        "model_type": model_type,
        "sharpe_ratio": sharpe,
        "profit_factor": pf_value,
        "win_rate": round(float(to_native(metrics.get('win_rate', 0))), 4),
        "num_trades": int(to_native(metrics.get('num_trades', 0))),
        "accuracy": round(float(to_native(metrics.get('accuracy', 0))), 4),
        "max_drawdown": round(float(to_native(metrics.get('max_drawdown', 0))), 4),
        "total_return": round(float(to_native(metrics.get('total_return', 0))), 4),
        "samples": int(to_native(metrics.get('samples', 0))),
        "deployable": is_deployable,
        "quality_tier": quality_tier,
        "trained_at": pd.Timestamp.now().isoformat()
    }

    all_metadata["last_updated"] = pd.Timestamp.now().isoformat()

    with open(metadata_file, 'w') as f:
        json.dump(all_metadata, f, indent=2)


def get_model_metadata():
    import json
    metadata_file = Path("models") / "model_metadata.json"

    if not metadata_file.exists():
        return {"models": {}, "last_updated": None}

    with open(metadata_file, 'r') as f:
        return json.load(f)


def load_tickers():
    spec_file = Path("SYSTEM_SPEC.yaml")
    if not spec_file.exists():
        raise FileNotFoundError("SYSTEM_SPEC.yaml not found")

    with open(spec_file, 'r') as f:
        config = yaml.safe_load(f)

    tickers = config['objectives']['universe']['tickers']
    return tickers


def train_single_ticker(ticker, model_type, label_mode, use_tuning, use_regime=True):
    try:
        df = load_dataset(ticker)

        regime_detector = RegimeDetector()
        df = regime_detector.detect_regimes(df)

        df = generate_labels(df, mode=label_mode)

        exclude_cols = [
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

        regime_feature_cols = ["regime_score", "trend_regime_num",
                               "volatility_regime_num", "momentum_regime_num"]

        feature_cols = [c for c in df.columns if c not in exclude_cols]
        if use_regime:
            feature_cols = [
                c for c in feature_cols if c not in regime_feature_cols] + regime_feature_cols

        df_clean = df.dropna(subset=feature_cols + ["label"])

        if len(df_clean) < 500:
            return {"status": "SKIP", "reason": f"Insufficient data ({len(df_clean)} samples)"}

        X = df_clean[feature_cols]
        y = df_clean["label"]
        forward_returns = df_clean["forward_ret"].values if "forward_ret" in df_clean.columns else np.zeros(
            len(y))

        # Use proper time split with embargo to prevent label leakage
        (
            X_train, X_val, X_test,
            y_train, y_val, y_test,
            fwd_ret_train, fwd_ret_val, fwd_ret_test
        ) = time_split_with_embargo(X, y, forward_returns, embargo_periods=FORWARD_PERIODS)

        regime_labels_all = df_clean["trend_regime"].values if "trend_regime" in df_clean.columns else None
        n_train = len(y_train)
        n_val_start = int(len(X) * 0.64)  # Match split point
        n_val_end = n_val_start + len(y_val)
        regime_labels_val = regime_labels_all[n_val_start:
                                              n_val_end] if regime_labels_all is not None else None

        if model_type == "return":
            # Calculate adaptive threshold based on ticker's actual volatility
            ticker_vol = np.std(fwd_ret_train[~np.isnan(fwd_ret_train)])
            adaptive_threshold = ticker_vol * 0.3  # 30% of forward return volatility

            model = train_model(
                model_type, X_train, fwd_ret_train, X_val, fwd_ret_val,
                use_tuning=use_tuning, regime_labels_val=None,
                adaptive_threshold=adaptive_threshold
            )
        else:
            Xb, yb = hybrid_balance(X_train, y_train)
            model = train_model(
                model_type, Xb, yb, X_val, y_val,
                use_tuning=use_tuning,
                regime_labels_val=regime_labels_val if use_tuning and use_regime else None
            )

        y_pred = model.predict(X_test)
        from sklearn.metrics import accuracy_score
        acc = accuracy_score(y_test, y_pred)

        fin_evaluator = FinancialMetrics(transaction_cost_bps=10)
        fin_metrics = fin_evaluator.evaluate(
            y_true=y_test,
            y_pred=y_pred,
            forward_returns=fwd_ret_test,
            holding_period=FORWARD_PERIODS
        )

        # Get test set indices for regime evaluation
        test_start_idx = int(len(df_clean) * 0.80)  # Match split point
        df_test = df_clean.iloc[test_start_idx:].copy()
        regime_eval = regime_detector.evaluate_by_regime(
            df_test, y_test, y_pred)

        regime_stats = regime_detector.get_regime_statistics(df_clean)

        metrics = {
            "accuracy": acc,
            "samples": len(df_clean),
            "sharpe_ratio": fin_metrics.sharpe_ratio,
            "max_drawdown": fin_metrics.max_drawdown,
            "profit_factor": fin_metrics.profit_factor,
            "win_rate": fin_metrics.win_rate,
            "total_return": fin_metrics.total_return,
            "num_trades": fin_metrics.num_trades
        }

        save_artifact(model, ticker, model_type, metrics=metrics)

        return {
            "status": "SUCCESS",
            "accuracy": acc,
            "samples": len(df_clean),
            "sharpe_ratio": fin_metrics.sharpe_ratio,
            "max_drawdown": fin_metrics.max_drawdown,
            "profit_factor": fin_metrics.profit_factor,
            "win_rate": fin_metrics.win_rate,
            "total_return": fin_metrics.total_return,
            "num_trades": fin_metrics.num_trades,
            "regime_bull_acc": regime_eval.get("trend_bull_accuracy", None),
            "regime_bear_acc": regime_eval.get("trend_bear_accuracy", None),
            "regime_sideways_acc": regime_eval.get("trend_sideways_accuracy", None),
            "regime_high_vol_acc": regime_eval.get("vol_high_accuracy", None),
            "dominant_trend": max(regime_stats.get("trend_distribution", {}),
                                  key=regime_stats.get("trend_distribution", {}).get, default="unknown")
        }

    except FileNotFoundError as e:
        return {"status": "SKIP", "reason": "No data file"}
    except Exception as e:
        return {"status": "ERROR", "reason": str(e)[:100]}


def train_walk_forward(ticker, model_type, label_mode, use_tuning, use_regime=True, n_splits=5):
    """
    Train using walk-forward validation for more robust performance estimates.

    Trains multiple models across time, aggregates metrics, and saves the
    final model trained on all available data.
    """
    try:
        df = load_dataset(ticker)

        regime_detector = RegimeDetector()
        df = regime_detector.detect_regimes(df)

        df = generate_labels(df, mode=label_mode)

        exclude_cols = [
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

        regime_feature_cols = ["regime_score", "trend_regime_num",
                               "volatility_regime_num", "momentum_regime_num"]

        feature_cols = [c for c in df.columns if c not in exclude_cols]
        if use_regime:
            feature_cols = [
                c for c in feature_cols if c not in regime_feature_cols] + regime_feature_cols

        df_clean = df.dropna(subset=feature_cols + ["label"])

        if len(df_clean) < 500:
            return {"status": "SKIP", "reason": f"Insufficient data ({len(df_clean)} samples)"}

        X = df_clean[feature_cols]
        y = df_clean["label"]
        forward_returns = df_clean["forward_ret"].values if "forward_ret" in df_clean.columns else np.zeros(
            len(y))

        # Collect metrics across all folds
        fold_metrics = []
        all_y_true = []
        all_y_pred = []
        all_fwd_ret = []

        fin_evaluator = FinancialMetrics(transaction_cost_bps=10)

        for X_train, X_test, y_train, y_test, fwd_ret_train, fwd_ret_test, fold_info in walk_forward_split(
            X, y, forward_returns, n_splits=n_splits, embargo_periods=FORWARD_PERIODS
        ):
            # Split train into train/val for early stopping (80/20)
            val_size = int(len(X_train) * 0.2)
            X_tr = X_train.iloc[:-val_size]
            X_vl = X_train.iloc[-val_size:]
            y_tr = y_train.iloc[:-val_size]
            y_vl = y_train.iloc[-val_size:]
            fwd_tr = fwd_ret_train[:-val_size]
            fwd_vl = fwd_ret_train[-val_size:]

            if model_type == "return":
                model = train_model(
                    model_type, X_tr, fwd_tr, X_vl, fwd_vl,
                    use_tuning=False, regime_labels_val=None
                )
            else:
                Xb, yb = hybrid_balance(X_tr, y_tr)
                model = train_model(
                    model_type, Xb, yb, X_vl, y_vl,
                    use_tuning=use_tuning, regime_labels_val=None
                )

            y_pred = model.predict(X_test)

            # Collect for aggregate metrics
            all_y_true.extend(y_test.values)
            all_y_pred.extend(y_pred)
            all_fwd_ret.extend(fwd_ret_test)

            # Per-fold metrics
            fold_result = fin_evaluator.evaluate(
                y_true=y_test, y_pred=y_pred,
                forward_returns=fwd_ret_test, holding_period=FORWARD_PERIODS
            )
            fold_metrics.append({
                "fold": fold_info["fold"],
                "sharpe": fold_result.sharpe_ratio,
                "pf": fold_result.profit_factor,
                "win_rate": fold_result.win_rate,
                "trades": fold_result.num_trades
            })

        # Aggregate metrics across all folds
        from sklearn.metrics import accuracy_score
        all_y_true = np.array(all_y_true)
        all_y_pred = np.array(all_y_pred)
        all_fwd_ret = np.array(all_fwd_ret)

        acc = accuracy_score(all_y_true, all_y_pred)
        agg_metrics = fin_evaluator.evaluate(
            y_true=all_y_true, y_pred=all_y_pred,
            forward_returns=all_fwd_ret, holding_period=FORWARD_PERIODS
        )

        # Train final model on all data (with embargo from end)
        final_train_end = len(X) - FORWARD_PERIODS
        X_final = X.iloc[:final_train_end]
        y_final = y.iloc[:final_train_end]
        fwd_final = forward_returns[:final_train_end]

        val_size = int(len(X_final) * 0.15)
        X_tr_final = X_final.iloc[:-val_size]
        X_vl_final = X_final.iloc[-val_size:]
        y_tr_final = y_final.iloc[:-val_size]
        y_vl_final = y_final.iloc[-val_size:]
        fwd_tr_final = fwd_final[:-val_size]
        fwd_vl_final = fwd_final[-val_size:]

        if model_type == "return":
            final_model = train_model(
                model_type, X_tr_final, fwd_tr_final, X_vl_final, fwd_vl_final,
                use_tuning=False, regime_labels_val=None
            )
        else:
            Xb, yb = hybrid_balance(X_tr_final, y_tr_final)
            final_model = train_model(
                model_type, Xb, yb, X_vl_final, y_vl_final,
                use_tuning=use_tuning, regime_labels_val=None
            )

        metrics = {
            "accuracy": acc,
            "samples": len(df_clean),
            "sharpe_ratio": agg_metrics.sharpe_ratio,
            "max_drawdown": agg_metrics.max_drawdown,
            "profit_factor": agg_metrics.profit_factor,
            "win_rate": agg_metrics.win_rate,
            "total_return": agg_metrics.total_return,
            "num_trades": agg_metrics.num_trades,
            "walk_forward_folds": n_splits
        }

        save_artifact(final_model, ticker, model_type, metrics=metrics)

        # Get regime stats
        regime_stats = regime_detector.get_regime_statistics(df_clean)

        return {
            "status": "SUCCESS",
            "accuracy": acc,
            "samples": len(df_clean),
            "sharpe_ratio": agg_metrics.sharpe_ratio,
            "max_drawdown": agg_metrics.max_drawdown,
            "profit_factor": agg_metrics.profit_factor,
            "win_rate": agg_metrics.win_rate,
            "total_return": agg_metrics.total_return,
            "num_trades": agg_metrics.num_trades,
            "wf_folds": n_splits,
            "regime_bull_acc": None,  # Not computed for walk-forward
            "regime_bear_acc": None,
            "regime_sideways_acc": None,
            "regime_high_vol_acc": None,
            "dominant_trend": max(regime_stats.get("trend_distribution", {}),
                                  key=regime_stats.get("trend_distribution", {}).get, default="unknown")
        }

    except FileNotFoundError as e:
        return {"status": "SKIP", "reason": "No data file"}
    except Exception as e:
        return {"status": "ERROR", "reason": str(e)[:100]}


def main():
    parser = argparse.ArgumentParser(
        description="Train models for all tickers in SYSTEM_SPEC.yaml"
    )
    parser.add_argument("--model", type=str, default="return",
                        choices=["lgbm", "xgb", "ensemble", "return"],
                        help="Model type to train (return = regression-based predictor, recommended)")
    parser.add_argument("--labels", type=str, default="multiclass",
                        choices=["binary", "multiclass"],
                        help="Label type")
    parser.add_argument("--tune", action="store_true",
                        help="Run hyperparameter tuning")
    parser.add_argument("--no-regime", action="store_true",
                        help="Disable regime features in training")
    parser.add_argument("--walk-forward", action="store_true",
                        help="Use walk-forward validation (more robust, slower)")
    parser.add_argument("--wf-splits", type=int, default=5,
                        help="Number of walk-forward splits (default: 5)")

    args = parser.parse_args()
    use_regime = not args.no_regime

    tickers = load_tickers()
    total = len(tickers)

    print(f"\n{'='*70}")
    print(f" BATCH TRAINING: {total} tickers")
    wf_str = f"WalkFwd({args.wf_splits})" if args.walk_forward else "SingleSplit"
    print(
        f" Model: {args.model} | Labels: {args.labels} | Tuning: {args.tune} | Regime: {use_regime}")
    print(f" Validation: {wf_str} | Embargo: {FORWARD_PERIODS} periods")
    print(f"{'='*70}\n")

    results = []

    for idx, ticker in enumerate(tickers, 1):
        print(f"\n[{idx}/{total}] {ticker}...", end=" ", flush=True)

        if args.walk_forward:
            result = train_walk_forward(
                ticker,
                args.model,
                args.labels,
                args.tune,
                use_regime,
                n_splits=args.wf_splits
            )
        else:
            result = train_single_ticker(
                ticker,
                args.model,
                args.labels,
                args.tune,
                use_regime
            )

        result["ticker"] = ticker
        results.append(result)

        if result["status"] == "SUCCESS":
            sharpe = result.get('sharpe_ratio', 0)
            pf = result.get('profit_factor', 0)
            pf_str = f"{pf:.2f}" if pf != float('inf') else "∞"
            print(
                f"✓ Acc:{result['accuracy']*100:.1f}% | Sharpe:{sharpe:.2f} | PF:{pf_str} | {result['samples']} samples")
        elif result["status"] == "SKIP":
            print(f"⊘ {result['reason']}")
        else:
            print(f"✗ {result['reason']}")

    print(f"\n{'='*70}")
    successful = [r for r in results if r['status'] == 'SUCCESS']
    skipped = [r for r in results if r['status'] == 'SKIP']
    failed = [r for r in results if r['status'] == 'ERROR']

    print(f" SUMMARY:")
    print(f"   ✓ Success: {len(successful)}/{total}")
    print(f"   ⊘ Skipped: {len(skipped)}/{total}")
    print(f"   ✗ Failed:  {len(failed)}/{total}")

    if successful:
        avg_acc = sum(r['accuracy'] for r in successful) / len(successful)
        avg_sharpe = sum(r.get('sharpe_ratio', 0)
                         for r in successful) / len(successful)
        avg_max_dd = sum(r.get('max_drawdown', 0)
                         for r in successful) / len(successful)
        avg_win_rate = sum(r.get('win_rate', 0)
                           for r in successful) / len(successful)

        valid_pf = [r.get('profit_factor', 0) for r in successful if r.get(
            'profit_factor', 0) != float('inf')]
        avg_pf = sum(valid_pf) / len(valid_pf) if valid_pf else 0

        print(f"\n   📊 CLASSIFICATION METRICS:")
        print(f"      Avg Accuracy: {avg_acc*100:.1f}%")

        print(f"\n   💰 FINANCIAL METRICS:")
        print(f"      Avg Sharpe Ratio: {avg_sharpe:.2f}")
        print(f"      Avg Max Drawdown: {avg_max_dd*100:.1f}%")
        print(f"      Avg Profit Factor: {avg_pf:.2f}")
        print(f"      Avg Win Rate: {avg_win_rate*100:.1f}%")

        bull_accs = [r.get('regime_bull_acc')
                     for r in successful if r.get('regime_bull_acc') is not None]
        bear_accs = [r.get('regime_bear_acc')
                     for r in successful if r.get('regime_bear_acc') is not None]
        sideways_accs = [r.get('regime_sideways_acc') for r in successful if r.get(
            'regime_sideways_acc') is not None]

        if bull_accs or bear_accs or sideways_accs:
            print(f"\n   📈 REGIME PERFORMANCE:")
            if bull_accs:
                print(
                    f"      Bull Market Accuracy: {sum(bull_accs)/len(bull_accs)*100:.1f}%")
            if bear_accs:
                print(
                    f"      Bear Market Accuracy: {sum(bear_accs)/len(bear_accs)*100:.1f}%")
            if sideways_accs:
                print(
                    f"      Sideways Accuracy: {sum(sideways_accs)/len(sideways_accs)*100:.1f}%")

    print(f"\n{'='*70}\n")

    summary_df = pd.DataFrame(results)
    summary_path = Path("models") / args.model / "training_summary.csv"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_df.to_csv(summary_path, index=False)
    print(f"📊 Summary saved to {summary_path}\n")


if __name__ == "__main__":
    main()
