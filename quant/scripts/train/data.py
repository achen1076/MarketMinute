"""Data loading, feature generation, and label generation."""

import yaml
import numpy as np
import pandas as pd
from pathlib import Path

from src.data.features.feature_engine import FeatureEngine
from src.data.labels.binary_labeler import BinaryLabeler
from src.data.labels.multiclass_labeler import MultiClassLabeler

from .config import FORWARD_PERIODS


def load_dataset(ticker: str):
    project_root = Path(__file__).resolve().parents[2]
    file = project_root / "data" / "processed" / \
        f"{ticker.lower()}_processed.csv"
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
            neutral_threshold_pct=0.015,
            strong_threshold_pct=0.04,
            dynamic_vol=True,
            vol_window=30,
            neutral_vol_scale=0.5,
            strong_vol_scale=1.5,
            max_strong_ratio=0.15,
            mode="strong_moves",
            subsample_interval=1,
        )

    df = labeler.fit_transform(df)
    return df


def load_tickers():
    project_root = Path(__file__).resolve().parents[2]
    spec_file = project_root / "SYSTEM_SPEC.yaml"
    if not spec_file.exists():
        raise FileNotFoundError("SYSTEM_SPEC.yaml not found")

    with open(spec_file, 'r') as f:
        config = yaml.safe_load(f)

    tickers = config['objectives']['universe']['tickers']
    return tickers
