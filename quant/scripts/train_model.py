"""
train_model.py
---------------------------------------------------------------------
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
from src.models.ensemble_classifier import QuantModel

from src.models.hyperparameter_tuner import LightGBMHyperparameterTuner
from src.models.xgb_hyperparameter_tuner import XGBHyperparameterTuner


# -----------------------------------------------------------
# Hybrid balancing (same as Mode A in main classifier)
# -----------------------------------------------------------
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


# -----------------------------------------------------------
# Load + preprocess stock data
# -----------------------------------------------------------
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


# -----------------------------------------------------------
# Label generation
# -----------------------------------------------------------
def generate_labels(df, mode="multiclass"):
    if mode == "binary":
        labeler = BinaryLabeler(
            forward_periods=10,
            threshold_pct=0.02,
            mode="strong_moves"
        )
    else:
        labeler = MultiClassLabeler(
            forward_periods=10,
            neutral_threshold_pct=0.01,
            strong_threshold_pct=0.025,
            dynamic_vol=True,
            vol_window=30,
            neutral_vol_scale=0.8,
            strong_vol_scale=2.0,
            max_strong_ratio=0.12,
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
    use_tuning=False
):
    if model_type == "lgbm":
        if use_tuning:
            tuner = LightGBMHyperparameterTuner(n_trials=40)
            params = tuner.tune(X_train, y_train, X_val, y_val)
        else:
            params = None

        model = LGBMClassifier(params=params)
        model.fit(X_train, y_train, X_val, y_val)
        return model

    elif model_type == "xgb":
        if use_tuning:
            tuner = XGBHyperparameterTuner(n_trials=40)
            params = tuner.tune(X_train, y_train, X_val, y_val)
        else:
            params = None

        model = XGBClassifier(params=params)
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


# -----------------------------------------------------------
# Save artifact
# -----------------------------------------------------------
def save_artifact(model, ticker, model_type):
    out_dir = Path("models") / model_type
    out_dir.mkdir(parents=True, exist_ok=True)

    filename = out_dir / f"{ticker}_{model_type}.pkl"

    with open(filename, "wb") as f:
        pickle.dump(model, f)

    print(f"\n💾 Saved model → {filename}\n")


# -----------------------------------------------------------
# Load tickers from SYSTEM_SPEC.yaml
# -----------------------------------------------------------
def load_tickers():
    """Load tickers from SYSTEM_SPEC.yaml"""
    spec_file = Path("SYSTEM_SPEC.yaml")
    if not spec_file.exists():
        raise FileNotFoundError("SYSTEM_SPEC.yaml not found")
    
    with open(spec_file, 'r') as f:
        config = yaml.safe_load(f)
    
    tickers = config['objectives']['universe']['tickers']
    return tickers


def train_single_ticker(ticker, model_type, label_mode, use_tuning):
    """Train model for a single ticker"""
    try:
        df = load_dataset(ticker)
        df = generate_labels(df, mode=label_mode)

        exclude_cols = [
            "timestamp", "open", "high", "low", "close", "volume", "ticker",
            "label", "forward_ret", "return_at_label",
            "rolling_vol", "neutral_thresh", "strong_thresh", "dyn_thresh"
        ]
        feature_cols = [c for c in df.columns if c not in exclude_cols]

        df_clean = df.dropna(subset=feature_cols + ["label"])
        
        if len(df_clean) < 500:
            return {"status": "SKIP", "reason": f"Insufficient data ({len(df_clean)} samples)"}
        
        X = df_clean[feature_cols]
        y = df_clean["label"]
        X_train, X_val, X_test, y_train, y_val, y_test = time_split(X, y)

        # Hybrid balance on training only
        Xb, yb = hybrid_balance(X_train, y_train)

        # Train model
        model = train_model(model_type, Xb, yb, X_val, y_val, use_tuning=use_tuning)

        # Save model
        save_artifact(model, ticker, model_type)

        # Evaluate on test set
        y_pred = model.predict(X_test)
        from sklearn.metrics import accuracy_score
        acc = accuracy_score(y_test, y_pred)

        return {
            "status": "SUCCESS",
            "accuracy": acc,
            "samples": len(df_clean)
        }

    except FileNotFoundError as e:
        return {"status": "SKIP", "reason": "No data file"}
    except Exception as e:
        return {"status": "ERROR", "reason": str(e)[:100]}


# -----------------------------------------------------------
# CLI Execution
# -----------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Train models for all tickers in SYSTEM_SPEC.yaml"
    )
    parser.add_argument("--model", type=str, default="lgbm",
                        choices=["lgbm", "xgb", "ensemble"],
                        help="Model type to train")
    parser.add_argument("--labels", type=str, default="multiclass",
                        choices=["binary", "multiclass"],
                        help="Label type")
    parser.add_argument("--tune", action="store_true",
                        help="Run hyperparameter tuning")

    args = parser.parse_args()

    # Load tickers from SYSTEM_SPEC.yaml
    tickers = load_tickers()
    total = len(tickers)

    print(f"\n{'='*70}")
    print(f" BATCH TRAINING: {total} tickers")
    print(f" Model: {args.model} | Labels: {args.labels} | Tuning: {args.tune}")
    print(f"{'='*70}\n")

    results = []

    for idx, ticker in enumerate(tickers, 1):
        print(f"\n[{idx}/{total}] {ticker}...", end=" ", flush=True)

        result = train_single_ticker(
            ticker,
            args.model,
            args.labels,
            args.tune
        )

        result["ticker"] = ticker
        results.append(result)

        # Print status
        if result["status"] == "SUCCESS":
            print(f"✓ {result['accuracy']*100:.1f}% | {result['samples']} samples")
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
        print(f"   Avg Accuracy: {avg_acc*100:.1f}%")

    print(f"{'='*70}\n")

    # Save summary
    summary_df = pd.DataFrame(results)
    summary_path = Path("models") / args.model / "training_summary.csv"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_df.to_csv(summary_path, index=False)
    print(f"📊 Summary saved to {summary_path}\n")


if __name__ == "__main__":
    main()
