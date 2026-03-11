"""Model artifact saving and metadata management."""

import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path


def save_artifact(model, ticker, model_type, metrics=None):
    project_root = Path(__file__).resolve().parents[2]
    out_dir = project_root / "models" / model_type
    out_dir.mkdir(parents=True, exist_ok=True)

    filename = out_dir / f"{ticker}_{model_type}.pkl"

    with open(filename, "wb") as f:
        pickle.dump(model, f)

    print(f"\n💾 Saved model → {filename}\n")

    if metrics:
        save_model_metadata(ticker, model_type, metrics)


def save_model_metadata(ticker, model_type, metrics):
    project_root = Path(__file__).resolve().parents[2]
    metadata_file = project_root / "models" / "model_metadata.json"

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
    elif pf is not None:
        pf = min(float(pf), 10.0)

    sharpe = round(float(to_native(metrics.get('sharpe_ratio', 0))), 2)
    pf_value = round(float(pf), 2) if pf is not None else None
    alpha = round(float(to_native(metrics.get('alpha', 0))), 2)

    is_deployable = (
        sharpe > 1.0 and
        pf_value is not None and
        pf_value > 1.5 and
        alpha > 0
    )

    if is_deployable and sharpe > 2.0 and (pf_value or 0) > 2.0 and alpha > 0.05:
        quality_tier = "excellent"
    elif is_deployable:
        quality_tier = "good"
    elif pf_value and pf_value > 1.0 and sharpe > 0 and alpha > 0:
        quality_tier = "marginal"
    elif sharpe is None and pf_value is None:
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
        "alpha": alpha,
        "benchmark_sharpe": round(float(to_native(metrics.get('benchmark_sharpe', 0))), 2),
        "long_ratio": round(float(to_native(metrics.get('long_ratio', 0))), 2),
        "samples": int(to_native(metrics.get('samples', 0))),
        "deployable": is_deployable,
        "quality_tier": quality_tier,
        "trained_at": pd.Timestamp.now().isoformat()
    }

    all_metadata["last_updated"] = pd.Timestamp.now().isoformat()

    with open(metadata_file, 'w') as f:
        json.dump(all_metadata, f, indent=2)


def get_model_metadata():
    project_root = Path(__file__).resolve().parents[2]
    metadata_file = project_root / "models" / "model_metadata.json"

    if not metadata_file.exists():
        return {"models": {}, "last_updated": None}

    with open(metadata_file, 'r') as f:
        return json.load(f)
