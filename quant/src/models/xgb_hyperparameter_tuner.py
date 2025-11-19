"""
XGBoost Hyperparameter Tuner for Imbalanced Multiclass Quant Models
Uses macro-F1 as optimization metric (critical for class imbalance).
Applies the same hybrid balancing used in the main classifier.
"""

import optuna
import numpy as np
import pandas as pd
import xgboost as xgb
from collections import Counter
from sklearn.metrics import f1_score
import logging

logger = logging.getLogger(__name__)


# -----------------------------------------------------
# Hybrid Balance (Mode A – soft oversampling)
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
# Class Weights for XGB
# -----------------------------------------------------
def compute_class_weights(y):
    counts = Counter(y)
    total = sum(counts.values())
    n_class = len(counts)
    return {c: total / (n_class * counts[c]) for c in counts}


# -----------------------------------------------------
# Tuner
# -----------------------------------------------------
class XGBHyperparameterTuner:
    def __init__(self, n_trials=40, use_gpu=False):
        self.n_trials = n_trials
        self.use_gpu = use_gpu
        self.study = None

    # ---------------------------------------------
    # OBJECTIVE
    # ---------------------------------------------
    def objective(self, trial, X_train, y_train, X_val, y_val):
        # Hybrid balancing
        Xb, yb = hybrid_balance(X_train, y_train)
        class_weights = compute_class_weights(yb)

        # Per-sample weight
        weight_array = np.array([class_weights[c] for c in yb])

        # Dynamic class penalty search
        class_penalty = trial.suggest_float("class_penalty", 0.8, 4.0)
        weight_array = weight_array * class_penalty

        # XGB param search space
        params = {
            "objective": "multi:softprob",
            "num_class": 3,
            "eval_metric": "mlogloss",  # still used for early stopping
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.15),
            "max_depth": trial.suggest_int("max_depth", 3, 7),
            "min_child_weight": trial.suggest_float("min_child_weight", 1.0, 10.0),
            "gamma": trial.suggest_float("gamma", 0.0, 5.0),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "reg_alpha": trial.suggest_float("reg_alpha", 0.0, 1.5),
            "reg_lambda": trial.suggest_float("reg_lambda", 0.5, 4.0),
            "random_state": 42,
            "nthread": -1,
        }

        if self.use_gpu:
            params["tree_method"] = "gpu_hist"
            params["predictor"] = "gpu_predictor"
        else:
            params["tree_method"] = "hist"

        # Scale features
        Xb_np = Xb.to_numpy() if isinstance(Xb, pd.DataFrame) else Xb
        Xv_np = X_val.to_numpy() if isinstance(X_val, pd.DataFrame) else X_val

        dtrain = xgb.DMatrix(Xb_np, label=yb, weight=weight_array)
        dval = xgb.DMatrix(Xv_np, label=y_val)

        # Train
        model = xgb.train(
            params,
            dtrain,
            num_boost_round=600,
            evals=[(dtrain, "train"), (dval, "val")],
            early_stopping_rounds=50,
            verbose_eval=False
        )

        # Macro-F1 (critical)
        preds = model.predict(dval)
        y_pred = np.argmax(preds, axis=1)

        score = f1_score(y_val, y_pred, average="macro", zero_division=0)

        return score

    # ---------------------------------------------
    # RUN TUNING
    # ---------------------------------------------
    def tune(self, X_train, y_train, X_val, y_val):
        def _objective(trial):
            return self.objective(trial, X_train, y_train, X_val, y_val)

        self.study = optuna.create_study(direction="maximize")
        self.study.optimize(
            _objective, n_trials=self.n_trials, show_progress_bar=True)

        logger.info(f"[XGB Tuner] Best Trial: {self.study.best_trial.number}")
        logger.info(
            f"[XGB Tuner] Best Score (macro-F1): {self.study.best_value:.4f}")
        logger.info(f"[XGB Tuner] Params: {self.study.best_trial.params}")

        return self.study.best_trial.params
