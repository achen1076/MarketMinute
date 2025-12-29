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

from src.evaluation.financial_metrics import FinancialMetrics
from src.evaluation.regime_detector import RegimeDetector


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
            forward_periods=10,
            threshold_pct=0.02,
            mode="strong_moves"
        )
    else:
        labeler = MultiClassLabeler(
            forward_periods=30,
            neutral_threshold_pct=0.005,
            strong_threshold_pct=0.015,
            dynamic_vol=False,
            vol_window=30,
            neutral_vol_scale=0.8,
            strong_vol_scale=2.0,
            max_strong_ratio=0.15,
            mode="strong_moves"
        )

    df = labeler.fit_transform(df)
    return df


def time_split(X, y):
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
    regime_labels_val=None
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
        # Return predictor uses forward returns directly, not class labels
        # y_train and y_val should be forward returns for this model type
        model = LGBMReturnPredictor(
            long_threshold=0.015, short_threshold=-0.015)
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

    # Save/update model metadata index for frontend consumption
    if metrics:
        save_model_metadata(ticker, model_type, metrics)


def save_model_metadata(ticker, model_type, metrics):
    """Save model metrics to a central JSON file for frontend consumption."""
    import json

    metadata_file = Path("models") / "model_metadata.json"

    # Load existing metadata or create new
    if metadata_file.exists():
        try:
            with open(metadata_file, 'r') as f:
                all_metadata = json.load(f)
        except json.JSONDecodeError:
            all_metadata = {"models": {}, "last_updated": None}
    else:
        all_metadata = {"models": {}, "last_updated": None}

    # Helper to convert numpy types to Python native types
    def to_native(val):
        if hasattr(val, 'item'):  # numpy scalar
            return val.item()
        return val

    # Handle infinity PF - store as null (JSON compatible)
    pf = to_native(metrics.get('profit_factor', 0))
    if pf == float('inf') or pf == float('-inf') or (pf is not None and np.isnan(pf)):
        pf = None  # Frontend can display as "∞"

    # Store model metrics - convert all values to native Python types
    sharpe = round(float(to_native(metrics.get('sharpe_ratio', 0))), 2)
    pf_value = round(float(pf), 2) if pf is not None else None

    # Determine if model is deployable (profitable enough to use)
    is_deployable = (
        sharpe > 1.0 and
        pf_value is not None and
        pf_value > 1.5
    )

    # Quality tier for frontend display
    if is_deployable and sharpe > 5.0 and (pf_value or 0) > 3.0:
        quality_tier = "excellent"
    elif is_deployable:
        quality_tier = "good"
    elif pf_value and pf_value > 1.0:
        quality_tier = "marginal"
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

    # Save updated metadata
    with open(metadata_file, 'w') as f:
        json.dump(all_metadata, f, indent=2)


def get_model_metadata():
    """Load model metadata for frontend consumption."""
    import json
    metadata_file = Path("models") / "model_metadata.json"

    if not metadata_file.exists():
        return {"models": {}, "last_updated": None}

    with open(metadata_file, 'r') as f:
        return json.load(f)


def load_tickers():
    """Load tickers from SYSTEM_SPEC.yaml"""
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

        # Detect market regimes before labeling
        regime_detector = RegimeDetector()
        df = regime_detector.detect_regimes(df)

        df = generate_labels(df, mode=label_mode)

        # Base exclusions
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

        # Include regime features if enabled
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

        X_train, X_val, X_test, y_train, y_val, y_test = time_split(X, y)

        # Split forward returns and regime labels for evaluation
        n_train = len(y_train)
        n_val = len(y_val)
        fwd_ret_test = forward_returns[n_train + n_val:]

        # Extract regime labels for validation set (used for regime-aware tuning)
        regime_labels_all = df_clean["trend_regime"].values if "trend_regime" in df_clean.columns else None
        regime_labels_val = regime_labels_all[n_train:n_train +
                                              n_val] if regime_labels_all is not None else None

        # For return model, use forward returns directly (no balancing needed)
        if model_type == "return":
            fwd_ret_train = forward_returns[:n_train]
            fwd_ret_val = forward_returns[n_train:n_train + n_val]
            model = train_model(
                model_type, X_train, fwd_ret_train, X_val, fwd_ret_val,
                use_tuning=False, regime_labels_val=None
            )
        else:
            # Hybrid balance on training only (for classification models)
            Xb, yb = hybrid_balance(X_train, y_train)
            model = train_model(
                model_type, Xb, yb, X_val, y_val,
                use_tuning=use_tuning,
                regime_labels_val=regime_labels_val if use_tuning and use_regime else None
            )

        # Evaluate on test set
        y_pred = model.predict(X_test)
        from sklearn.metrics import accuracy_score
        acc = accuracy_score(y_test, y_pred)

        # Financial metrics evaluation
        fin_evaluator = FinancialMetrics(transaction_cost_bps=10)
        fin_metrics = fin_evaluator.evaluate(
            y_true=y_test,
            y_pred=y_pred,
            forward_returns=fwd_ret_test,
            holding_period=10
        )

        # Regime-based evaluation
        df_test = df_clean.iloc[n_train + n_val:].copy()
        regime_eval = regime_detector.evaluate_by_regime(
            df_test, y_test, y_pred)

        # Get regime statistics
        regime_stats = regime_detector.get_regime_statistics(df_clean)

        # Collect metrics for metadata storage
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

        # Save model with metrics for frontend
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

    args = parser.parse_args()
    use_regime = not args.no_regime

    # Load tickers from SYSTEM_SPEC.yaml
    tickers = load_tickers()
    total = len(tickers)

    print(f"\n{'='*70}")
    print(f" BATCH TRAINING: {total} tickers")
    print(
        f" Model: {args.model} | Labels: {args.labels} | Tuning: {args.tune} | Regime: {use_regime}")
    print(f"{'='*70}\n")

    results = []

    for idx, ticker in enumerate(tickers, 1):
        print(f"\n[{idx}/{total}] {ticker}...", end=" ", flush=True)

        result = train_single_ticker(
            ticker,
            args.model,
            args.labels,
            args.tune,
            use_regime
        )

        result["ticker"] = ticker
        results.append(result)

        # Print status
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

    # Summary
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

        # Filter out infinite profit factors for averaging
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

        # Regime performance summary
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

    # Save summary
    summary_df = pd.DataFrame(results)
    summary_path = Path("models") / args.model / "training_summary.csv"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_df.to_csv(summary_path, index=False)
    print(f"📊 Summary saved to {summary_path}\n")


if __name__ == "__main__":
    main()
