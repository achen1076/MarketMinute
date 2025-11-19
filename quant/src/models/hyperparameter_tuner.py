"""
LightGBM Hyperparameter Tuner (Multiclass Financial Time-Series)
Uses macro-F1 (not logloss) to optimize for imbalanced 3-class quant datasets.
Applies the same hybrid balancing (soft oversampling + class weights)
used in the main classifier.
"""

import optuna
import numpy as np
import pandas as pd
from sklearn.metrics import f1_score
from collections import Counter
import lightgbm as lgb
import logging

logger = logging.getLogger(__name__)


# -----------------------------------------------------
# Hybrid Balance (Mode A – Soft Oversampling)
# -----------------------------------------------------
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


# -----------------------------------------------------
# Class Weights
# -----------------------------------------------------
def compute_class_weights(y):
    """
    Compute proportional class weights: total_samples / (num_classes * count_class)
    """
    counts = Counter(y)
    total = sum(counts.values())
    n_class = len(counts)
    return {cls: total / (n_class * cnt) for cls, cnt in counts.items()}


# -----------------------------------------------------
# LightGBM Hyperparameter Tuner
# -----------------------------------------------------
class LightGBMHyperparameterTuner:
    def __init__(self, n_trials=40, use_gpu=False):
        self.n_trials = n_trials
        self.use_gpu = use_gpu
        self.study = None

    # -------------------------------------------------
    # Optimizable Objective
    # -------------------------------------------------
    def objective(self, trial, X_train, y_train, X_val, y_val):

        # Hybrid balance
        Xb, yb = hybrid_balance(X_train, y_train)
        class_weights = compute_class_weights(yb)

        # Per-sample weights
        weight_array = np.array([class_weights[c] for c in yb])

        # Additional class penalty (tunable)
        penalty = trial.suggest_float("class_penalty", 0.8, 4.0)
        weight_array = weight_array * penalty

        # Parameter search space for LGBM
        params = {
            "objective": "multiclass",
            "num_class": 3,
            "metric": "multi_logloss",  # for early stopping only
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.15),
            "num_leaves": trial.suggest_int("num_leaves", 16, 128),
            "max_depth": trial.suggest_int("max_depth", 3, 9),
            "min_data_in_leaf": trial.suggest_int("min_data_in_leaf", 50, 600),
            "feature_fraction": trial.suggest_float("feature_fraction", 0.6, 1.0),
            "bagging_fraction": trial.suggest_float("bagging_fraction", 0.6, 1.0),
            "bagging_freq": trial.suggest_int("bagging_freq", 1, 8),
            "lambda_l1": trial.suggest_float("lambda_l1", 0.0, 5.0),
            "lambda_l2": trial.suggest_float("lambda_l2", 0.0, 5.0),
            "min_gain_to_split": trial.suggest_float("min_gain_to_split", 0.0, 3.0),
            "verbosity": -1,
            "force_col_wise": True,
            "deterministic": True,
            "num_threads": -1,
        }

        if self.use_gpu:
            params["device_type"] = "gpu"
        else:
            params["device_type"] = "cpu"

        # Dataset
        train_data = lgb.Dataset(Xb, label=yb, weight=weight_array)
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

        # Train
        model = lgb.train(
            params,
            train_data,
            valid_sets=[train_data, val_data],
            num_boost_round=800,
            early_stopping_rounds=50,
            verbose_eval=False,
        )

        # Predict
        preds = model.predict(X_val)
        y_pred = np.argmax(preds, axis=1)

        # Macro-F1 for imbalanced 3-class
        score = f1_score(y_val, y_pred, average="macro", zero_division=0)

        return score

    # -------------------------------------------------
    # Run optimization
    # -------------------------------------------------
    def tune(self, X_train, y_train, X_val, y_val):
        def _objective(trial):
            return self.objective(trial, X_train, y_train, X_val, y_val)

        self.study = optuna.create_study(direction="maximize")
        self.study.optimize(
            _objective, n_trials=self.n_trials, show_progress_bar=True)

        logger.info(f"[LGBM Tuner] Best Trial: {self.study.best_trial.number}")
        logger.info(f"[LGBM Tuner] Best Macro-F1: {self.study.best_value:.4f}")
        logger.info(f"[LGBM Tuner] Params: {self.study.best_trial.params}")

        return self.study.best_trial.params
