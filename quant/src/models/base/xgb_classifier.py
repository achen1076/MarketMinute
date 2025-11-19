"""
XGBoost classifier for multiclass quant prediction.
Includes hybrid class balancing (class weights + soft oversampling).
"""

import xgboost as xgb
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from collections import Counter
import logging
import pickle

logger = logging.getLogger(__name__)


# -----------------------------------------------------
# Hybrid Balance (Mode A – soft oversampling)
# -----------------------------------------------------
def hybrid_balance(X, y, multiplier=1.4):
    """
    Duplicate minority samples (no synthetic data).

    Safe for financial time-series:
      - preserves realistic return sequences
      - keeps ordering stable after training
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

    logger.info(f"[BALANCE] Before={counts}, After={dict(Counter(y_bal))}")
    return X_bal, y_bal


# -----------------------------------------------------
# Class Weight Calculation for XGBoost
# -----------------------------------------------------
def compute_class_weights(y):
    """
    Compute balanced class weights for multiclass XGBoost.

    XGBoost doesn't accept a full class_weight dict in multiclass,
    but allows per-class weighting via "weight" in DMatrix.

    We compute global weights:
        w[c] = total_samples / (num_classes * class_count[c])
    """
    counts = Counter(y)
    total = sum(counts.values())
    n_classes = len(counts)

    weights = {c: total / (n_classes * counts[c]) for c in counts}
    return weights


# -----------------------------------------------------
# Main Classifier
# -----------------------------------------------------
class XGBClassifier:
    """XGBoost classifier with hybrid class balancing."""

    def __init__(self, params=None, use_tuning=False, use_gpu=False):
        self.use_tuning = use_tuning
        self.use_gpu = use_gpu

        # Default optimized for 3-class quant classification
        default_params = {
            'objective': 'multi:softprob',
            'num_class': 3,
            'eval_metric': 'mlogloss',
            'learning_rate': 0.03,
            'max_depth': 5,
            'min_child_weight': 4,
            'subsample': 0.9,
            'colsample_bytree': 0.9,
            'gamma': 0.1,
            'reg_alpha': 0.2,
            'reg_lambda': 0.2,
            'random_state': 42,
            'nthread': -1,
            'verbosity': 0
        }

        if use_gpu:
            default_params['tree_method'] = 'gpu_hist'
            default_params['predictor'] = 'gpu_predictor'
        else:
            default_params['tree_method'] = 'hist'

        self.params = params or default_params

        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.tuning_study = None

    # -------------------------------------------------
    # FIT
    # -------------------------------------------------
    def fit(self, X, y, X_val=None, y_val=None):
        """
        Train XGBoost with hybrid balancing.
        """

        # Map labels to 0, 1, 2
        label_map = {-1: 0, 0: 1, 1: 2}
        y_mapped = np.array([label_map[a] for a in y])

        if X_val is not None:
            y_val_mapped = np.array([label_map[a] for a in y_val])

        # Store feature names for importance
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)

        # --------- Hybrid balance ----------
        Xb, yb = hybrid_balance(X, y_mapped)
        class_weights = compute_class_weights(yb)
        logger.info(f"[CLASS WEIGHTS] {class_weights}")

        # Assign per-sample weights to DMatrix
        weight_array = np.array([class_weights[c] for c in yb])

        # --------- Scale ----------
        Xb_scaled = self.scaler.fit_transform(Xb)

        dtrain = xgb.DMatrix(Xb_scaled, label=yb, weight=weight_array)

        evals = [(dtrain, "train")]

        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            dval = xgb.DMatrix(X_val_scaled, label=y_val_mapped)
            evals.append((dval, "val"))

        # --------- Train ----------
        self.model = xgb.train(
            params=self.params,
            dtrain=dtrain,
            num_boost_round=800,
            evals=evals,
            early_stopping_rounds=75,
            verbose_eval=50
        )

        logger.info(f"[XGB] Best iteration: {self.model.best_iteration}")
        return self

    # -------------------------------------------------
    # Predict
    # -------------------------------------------------
    def predict_proba(self, X):
        X_scaled = self.scaler.transform(X)
        dtest = xgb.DMatrix(X_scaled)
        return self.model.predict(dtest)

    def predict(self, X):
        probas = self.predict_proba(X)
        labels = np.argmax(probas, axis=1)

        label_map_reverse = {0: -1, 1: 0, 2: 1}
        return np.array([label_map_reverse[a] for a in labels])

    # -------------------------------------------------
    # Feature Importance
    # -------------------------------------------------
    def get_feature_importance(self, importance_type='gain'):
        if self.model is None:
            return None

        importance = self.model.get_score(importance_type=importance_type)

        if self.feature_names:
            mapped = {}
            for k, v in importance.items():
                if k.startswith("f"):
                    idx = int(k[1:])
                    if idx < len(self.feature_names):
                        mapped[self.feature_names[idx]] = v
            return pd.DataFrame({
                "feature": list(mapped.keys()),
                "importance": list(mapped.values())
            }).sort_values("importance", ascending=False)

        return importance

    # -------------------------------------------------
    # Save + Load
    # -------------------------------------------------
    def save(self, path):
        artifact = {
            "model": self.model,
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "params": self.params
        }
        with open(path, "wb") as f:
            pickle.dump(artifact, f)
        logger.info(f"[XGB] Saved to {path}")

    @classmethod
    def load(cls, path):
        with open(path, "rb") as f:
            artifact = pickle.load(f)

        inst = cls()
        inst.model = artifact["model"]
        inst.scaler = artifact["scaler"]
        inst.feature_names = artifact.get("feature_names")
        inst.params = artifact.get("params", inst.params)

        logger.info(f"[XGB] Loaded from {path}")
        return inst
