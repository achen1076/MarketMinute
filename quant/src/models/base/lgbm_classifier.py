"""
LightGBM classifier with hybrid balancing (class weights + safe oversampling).
Optimized for imbalanced 3-class quant classification.
"""

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from collections import Counter
import logging
import pickle
import subprocess

logger = logging.getLogger(__name__)


def check_gpu_available():
    """Check if GPU is available for LightGBM."""
    try:
        result = subprocess.run(
            ['nvidia-smi'], capture_output=True, text=True, timeout=2)
        if result.returncode == 0:
            logger.info("[GPU] NVIDIA GPU detected - using GPU")
            return True
    except:
        pass

    logger.info("[CPU] GPU not available - using CPU")
    return False


def hybrid_balance(X, y, multiplier=1.4):
    """
    Soft oversampling:
        - duplicates minority samples (no synthetic data)
        - preserves time-series ordering

    Args:
        X: training features (DataFrame or ndarray)
        y: labels
        multiplier: duplication factor for minority classes

    Returns:
        X_balanced, y_balanced
    """
    df = X.copy()
    df["label"] = y

    counts = df["label"].value_counts().to_dict()
    max_class = max(counts.values())

    combined = []

    for cls, count in counts.items():
        subset = df[df["label"] == cls]

        if count < max_class:
            repeat_factor = int((max_class / count - 1) * multiplier)
            repeat_factor = max(1, repeat_factor)

            oversampled = pd.concat([subset] * repeat_factor, axis=0)
            combined.append(oversampled)

        combined.append(subset)

    df_bal = pd.concat(combined, axis=0).sample(frac=1, random_state=42)

    y_bal = df_bal["label"].values
    X_bal = df_bal.drop(columns=["label"])

    logger.info(
        f"[BALANCE] Before={dict(counts)}, After={dict(Counter(y_bal))}")
    return X_bal, y_bal


def compute_class_weights(y):
    """
    Compute balanced class weights for LightGBM.
    y must be mapped 0,1,2
    """
    counts = Counter(y)
    total = sum(counts.values())
    n_classes = len(counts)

    weights = {c: total / (n_classes * counts[c]) for c in counts}
    return weights


class LGBMClassifier:
    """LightGBM classifier with hybrid imbalance handling."""

    def __init__(self, params=None, use_tuning=False, use_gpu='auto'):
        self.use_tuning = use_tuning

        if use_gpu == "auto":
            self.use_gpu = check_gpu_available()
        else:
            self.use_gpu = use_gpu

        default_params = {
            'objective': 'multiclass',
            'num_class': 3,
            'metric': 'multi_logloss',
            'learning_rate': 0.03,
            'num_leaves': 63,
            'max_depth': -1,
            'min_child_samples': 30,
            'subsample': 0.85,
            'colsample_bytree': 0.85,
            'reg_alpha': 0.2,
            'reg_lambda': 0.2,
            'random_state': 42,
            'n_jobs': -1,
            'verbosity': -1
        }

        if self.use_gpu:
            default_params["device"] = "gpu"
            default_params["gpu_platform_id"] = 0
            default_params["gpu_device_id"] = 0

        self.params = params or default_params
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None

    def fit(self, X, y, X_val=None, y_val=None, calibrate=False):
        """
        Train the model with hybrid balancing.
        """

        # Map labels to 0,1,2
        label_map = {-1: 0, 0: 1, 1: 2}
        y_mapped = np.array([label_map[a] for a in y])

        if X_val is not None:
            y_val_mapped = np.array([label_map[a] for a in y_val])

        # Store feature names if DataFrame
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)

        Xb, yb = hybrid_balance(X, y_mapped)
        class_weights = compute_class_weights(yb)
        logger.info(f"[CLASS WEIGHTS] {class_weights}")

        # Convert class weights to per-sample weights
        weight_array = np.array([class_weights[c] for c in yb])

        Xb_scaled = self.scaler.fit_transform(Xb)

        train_data = lgb.Dataset(Xb_scaled, label=yb, weight=weight_array)

        valid_sets = [train_data]
        valid_names = ["train"]

        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            val_data = lgb.Dataset(X_val_scaled, label=y_val_mapped)
            valid_sets.append(val_data)
            valid_names.append("val")

        # --------- Train ----------
        self.model = lgb.train(
            self.params,
            train_data,
            num_boost_round=800,
            valid_sets=valid_sets,
            valid_names=valid_names,
            callbacks=[
                lgb.early_stopping(75),
                lgb.log_evaluation(50)
            ]
        )

        logger.info(f"[LGBM] Best iteration: {self.model.best_iteration}")
        return self

    def predict_proba(self, X):
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict(self, X):
        probas = self.predict_proba(X)
        labels = np.argmax(probas, axis=1)

        # Map back to -1,0,1
        label_map_reverse = {0: -1, 1: 0, 2: 1}
        return np.array([label_map_reverse[a] for a in labels])

    def get_feature_importance(self, importance_type="gain"):
        if self.model is None:
            return None

        importance = self.model.feature_importance(
            importance_type=importance_type)
        if self.feature_names:
            return pd.DataFrame({
                "feature": self.feature_names,
                "importance": importance
            }).sort_values("importance", ascending=False)
        return importance

    def save(self, path):
        artifact = {
            "model": self.model,
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "params": self.params
        }
        with open(path, "wb") as f:
            pickle.dump(artifact, f)
        logger.info(f"[LGBM] Saved to {path}")

    @classmethod
    def load(cls, path):
        with open(path, "rb") as f:
            artifact = pickle.load(f)

        inst = cls()
        inst.model = artifact["model"]
        inst.scaler = artifact["scaler"]
        inst.feature_names = artifact["feature_names"]
        inst.params = artifact["params"]
        logger.info(f"[LGBM] Loaded from {path}")
        return inst
