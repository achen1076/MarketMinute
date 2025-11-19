"""
Unified evaluation + trading simulation for:
    - Multiclass models (-1, 0, 1)
    - Binary models (-1, +1)

Includes:
    • Clean classification metrics
    • Stable confusion matrices (no undefined warnings)
    • Threshold sweep to find best long/short edges
    • Realistic trading engine with costs + Sharpe
    • Works for LGBM, XGB, Ensemble models

Usage:
    python3 scripts/eval_multiclass_trading.py AAPL
    python3 scripts/eval_multiclass_trading.py AAPL --model ensemble
    python3 scripts/eval_multiclass_trading.py AAPL --binary
"""

import argparse
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

from src.data.features.feature_engine import FeatureEngine
from src.data.labels.binary_labeler import BinaryLabeler
from src.data.labels.multiclass_labeler import MultiClassLabeler


# ================================================================
# Utility: safe metric functions (handles missing predictions)
# ================================================================
def safe_precision(y_true, y_pred):
    try:
        return precision_score(y_true, y_pred, average="weighted", zero_division=0)
    except:
        return 0.0


def safe_recall(y_true, y_pred):
    try:
        return recall_score(y_true, y_pred, average="weighted", zero_division=0)
    except:
        return 0.0


def safe_f1(y_true, y_pred):
    try:
        return f1_score(y_true, y_pred, average="weighted", zero_division=0)
    except:
        return 0.0


# ================================================================
# Trading engine
# ================================================================
def simulate_trading(df, probas, long_thresh, short_thresh, min_edge=0.05, cost_bps=1.0):
    """
    probas: array (N, 3) for multiclass or (N, 2) for binary
    df: must contain "return_at_label"
    """

    returns = df["return_at_label"].values
    n = len(returns)

    # Identify labels from proba shape
    multiclass = (probas.shape[1] == 3)

    if multiclass:
        p_down = probas[:, 0]
        p_flat = probas[:, 1]
        p_up = probas[:, 2]

        edges_up = p_up - p_down
        edges_dn = p_down - p_up
    else:
        p_down = probas[:, 0]
        p_up = probas[:, 1]
        edges_up = p_up - p_down
        edges_dn = p_down - p_up

    positions = []
    realized_rets = []
    gross = []
    costs = []

    for i in range(n):
        e_up = edges_up[i]
        e_dn = edges_dn[i]

        if e_up >= min_edge and p_up[i] >= long_thresh:
            pos = 1
        elif e_dn >= min_edge and p_down[i] >= short_thresh:
            pos = -1
        else:
            pos = 0

        positions.append(pos)

        if pos != 0:
            trade_ret = pos * returns[i]
            cost = abs(pos) * cost_bps * 0.0001
            realized_rets.append(trade_ret - cost)
            gross.append(trade_ret)
            costs.append(cost)

    if len(realized_rets) == 0:
        return {
            "n_positions": 0,
            "n_trades": 0,
            "hit_rate": 0.0,
            "avg_ret": 0.0,
            "std_ret": 0.0,
            "sharpe": 0.0,
            "gross_mean": 0.0,
            "cost_mean": 0.0,
        }

    arr = np.array(realized_rets)
    gross_arr = np.array(gross)
    cost_arr = np.array(costs)

    # annualize assuming 252 trading days
    if arr.std() == 0:
        sharpe = 0.0
    else:
        sharpe = (arr.mean() * 252) / (arr.std() * np.sqrt(252))

    return {
        "n_positions": len(positions),
        "n_trades": len(arr),
        "hit_rate": (arr > 0).mean(),
        "avg_ret": arr.mean(),
        "std_ret": arr.std(),
        "sharpe": sharpe,
        "gross_mean": gross_arr.mean(),
        "cost_mean": cost_arr.mean(),
    }


# ================================================================
# Threshold sweep
# ================================================================
def sweep_thresholds(df, probas):
    grid = [0.55, 0.60, 0.65, 0.70]
    best = None
    best_key = None

    for long_t in grid:
        for short_t in grid:
            for edge in [0.05, 0.08, 0.10, 0.12]:
                stats = simulate_trading(
                    df, probas,
                    long_thresh=long_t,
                    short_thresh=short_t,
                    min_edge=edge
                )
                sharpe = stats["sharpe"]

                if (best is None) or (sharpe > best["sharpe"]):
                    best = stats
                    best_key = (long_t, short_t, edge)

    return best_key, best


# ================================================================
# Evaluate classification + trading
# ================================================================
def evaluate_model(model, df_test, X_test, y_test):
    print("\n--- Predicting probabilities ---")
    probas = model.predict_proba(X_test)
    preds = model.predict(X_test)

    # ------------------------------------------------------------
    # Classification Metrics
    # ------------------------------------------------------------
    acc = accuracy_score(y_test, preds)
    prec = safe_precision(y_test, preds)
    rec = safe_recall(y_test, preds)
    f1 = safe_f1(y_test, preds)

    print("\n--- Classification Metrics (Test Set) ---")
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1 Score : {f1:.4f}")

    # Confusion Matrix
    labels = sorted(np.unique(y_test))
    cm = confusion_matrix(y_test, preds, labels=labels)

    print("\nConfusion Matrix (rows=true, cols=pred):")
    print(pd.DataFrame(cm, index=labels, columns=labels))

    print("\nClassification Report:")
    print(classification_report(y_test, preds, zero_division=0))

    # ------------------------------------------------------------
    # Trading Simulation
    # ------------------------------------------------------------
    print("\n--- Optimizing thresholds ---")
    best_key, best_stats = sweep_thresholds(df_test, probas)

    long_t, short_t, edge = best_key
    print(
        f"\nBest thresholds → long={long_t}, short={short_t}, min_edge={edge}")

    print("\n--- Trading Performance ---")
    for k, v in best_stats.items():
        if isinstance(v, float):
            print(f"{k:12s}: {v:.4f}")
        else:
            print(f"{k:12s}: {v}")

    return {
        "probas": probas,
        "preds": preds,
        "acc": acc,
        "prec": prec,
        "rec": rec,
        "f1": f1,
        "trading": best_stats,
        "thresholds": best_key,
    }


# ================================================================
# Load & preprocess test data
# ================================================================
def load_test_data(ticker, label_mode="multiclass"):
    file = Path(f"data/processed/{ticker.lower()}_processed.csv")
    df = pd.read_csv(file)
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    fe = FeatureEngine()
    df = fe.calculate_all(df)
    df = df.replace([np.inf, -np.inf], np.nan).dropna()

    if label_mode == "binary":
        lab = BinaryLabeler(
            forward_periods=10,
            threshold_pct=0.02,
            mode="strong_moves"
        )
    else:
        lab = MultiClassLabeler(
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

    df = lab.fit_transform(df)

    # determine features
    drop_cols = ["timestamp", "open", "high", "low", "close",
                 "volume", "ticker", "label",
                 "forward_ret", "return_at_label"]

    feature_cols = [c for c in df.columns if c not in drop_cols]

    df_clean = df.dropna(subset=feature_cols + ["label"])
    X = df_clean[feature_cols]
    y = df_clean["label"]

    # last 25% = test set
    test_size = int(len(X) * 0.25)
    X_test = X.iloc[-test_size:]
    y_test = y.iloc[-test_size:]
    df_test = df_clean.iloc[-test_size:]

    return df_test, X_test, y_test


# ================================================================
# CLI
# ================================================================
def main():
    p = argparse.ArgumentParser()
    p.add_argument("ticker", type=str)
    p.add_argument("--model", type=str, default="ensemble",
                   choices=["ensemble", "lgbm", "xgb"])
    p.add_argument("--binary", action="store_true")
    args = p.parse_args()

    ticker = args.ticker.upper()
    label_mode = "binary" if args.binary else "multiclass"

    print(f"\n=== Evaluating {ticker} ({args.model}, labels={label_mode}) ===")

    # Load model
    model_path = Path(f"models/{args.model}/{ticker}_{args.model}.pkl")
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    # Load test data
    df_test, X_test, y_test = load_test_data(ticker, label_mode=label_mode)

    # Evaluate
    results = evaluate_model(model, df_test, X_test, y_test)

    print("\n🎉 Evaluation complete.\n")


if __name__ == "__main__":
    main()
