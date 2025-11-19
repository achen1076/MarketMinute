"""
Ensemble classifier combining LightGBM, XGBoost, and (optionally) deep learning models.
Redesigned to handle imbalance correctly and prevent collapse into a single model.
"""

import numpy as np
import pandas as pd
from typing import List, Any, Dict, Optional
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import logging

logger = logging.getLogger(__name__)


# -------------------------------------------------------
# Helper: Balanced score for ensemble weighting
# -------------------------------------------------------
def compute_model_score(y_true, y_pred):
    """
    Compute a balanced model score (macro F1).
    This prevents dominance by majority classes in financial data.
    """
    try:
        return f1_score(y_true, y_pred, average="macro", zero_division=0)
    except:
        return 0.0


# -------------------------------------------------------
# Ensemble Classifier
# -------------------------------------------------------
class EnsembleClassifier:
    """
    Ensemble classifier with improved weighted averaging, voting, and stacking.
    """

    def __init__(self, models: List[Any], strategy: str = "weighted", weights: Optional[List[float]] = None):
        self.models = models
        self.strategy = strategy
        self.weights = weights
        self.meta_model = None
        self.validation_scores = None

        if strategy == "weighted" and weights is None:
            logger.info(
                "[Ensemble] Using equal weights until validation weighting occurs.")
            self.weights = [1.0 / len(models)] * len(models)

    # ---------------------------------------------------
    # Compute weights using macro-F1 (fixed imbalance issue)
    # ---------------------------------------------------
    def compute_weights(self, X_val, y_val, power=2.0):
        preds = []
        scores = []

        for model in self.models:
            y_pred = model.predict(X_val)
            score = compute_model_score(y_val, y_pred)
            scores.append(score)
            preds.append(y_pred)

        self.validation_scores = scores

        # If all models collapse to 0 score, fallback to equal weights
        if sum(scores) == 0:
            logger.warning(
                "[Ensemble] All model scores are zero. Falling back to equal weights.")
            self.weights = [1.0 / len(self.models)] * len(self.models)
            return

        # Power-scaling -> softmax-like behavior
        powered = np.array([s**power for s in scores])
        powered = powered / powered.sum()

        self.weights = powered.tolist()

        logger.info(
            f"[Ensemble] Weights (macro-F1, power={power}): {self.weights}")
        logger.info(f"[Ensemble] Raw scores: {scores}")

    # ---------------------------------------------------
    # Stacking meta learner
    # ---------------------------------------------------
    def fit_meta_model(self, X_train, y_train, X_val=None, y_val=None):
        """
        Train a LightGBM stacking meta model using probabilities from each base model.
        """
        from .base.lgbm_classifier import LGBMClassifier

        train_probs = [m.predict_proba(X_train) for m in self.models]
        X_meta = np.hstack(train_probs)

        params = {
            "objective": "multiclass",
            "num_class": 3,
            "learning_rate": 0.03,
            "num_leaves": 15,
            "max_depth": 3,
            "verbosity": -1
        }

        self.meta_model = LGBMClassifier(params=params)

        if X_val is not None:
            val_probs = [m.predict_proba(X_val) for m in self.models]
            X_val_meta = np.hstack(val_probs)
            self.meta_model.fit(X_meta, y_train, X_val_meta, y_val)
        else:
            self.meta_model.fit(X_meta, y_train)

        logger.info("[Ensemble] Meta-model trained for stacking.")

    # ---------------------------------------------------
    # Probability Prediction
    # ---------------------------------------------------
    def predict_proba(self, X):
        all_probs = [m.predict_proba(X) for m in self.models]

        if self.strategy == "average":
            return np.mean(all_probs, axis=0)

        elif self.strategy == "weighted":
            return sum(w * p for w, p in zip(self.weights, all_probs))

        elif self.strategy == "voting":
            votes = np.zeros_like(all_probs[0])
            for probs in all_probs:
                class_preds = np.argmax(probs, axis=1)
                for i, pred in enumerate(class_preds):
                    votes[i, pred] += 1
            votes = votes / len(self.models)
            return votes

        elif self.strategy == "stacking":
            meta_input = np.hstack(all_probs)
            return self.meta_model.predict_proba(meta_input)

        else:
            raise ValueError(f"Unknown ensemble strategy: {self.strategy}")

    # ---------------------------------------------------
    # Class Prediction
    # ---------------------------------------------------
    def predict(self, X):
        probas = self.predict_proba(X)
        labels = np.argmax(probas, axis=1)

        label_map_reverse = {0: -1, 1: 0, 2: 1}
        return np.array([label_map_reverse[l] for l in labels])

    # ---------------------------------------------------
    # Evaluation
    # ---------------------------------------------------

    def evaluate(self, X, y):
        y_pred = self.predict(X)

        results = {
            "ensemble": {
                "accuracy": accuracy_score(y, y_pred),
                "precision": precision_score(y, y_pred, average='macro', zero_division=0),
                "recall": recall_score(y, y_pred, average='macro', zero_division=0),
                "f1": f1_score(y, y_pred, average='macro', zero_division=0)
            },
            "individual_models": []
        }

        # Evaluate base models
        for i, m in enumerate(self.models):
            yp = m.predict(X)
            results["individual_models"].append({
                "model": f"{m.__class__.__name__}_{i}",
                "accuracy": accuracy_score(y, yp),
                "precision": precision_score(y, yp, average='macro', zero_division=0),
                "recall": recall_score(y, yp, average='macro', zero_division=0),
                "f1": f1_score(y, yp, average='macro', zero_division=0)
            })

        return results


# -------------------------------------------------------
# QuantModel Wrapper
# -------------------------------------------------------
class QuantModel:
    """
    Wrapper that combines pretrained LightGBM/XGB/Deep models into a usable ensemble.
    """

    def __init__(
        self,
        use_lstm=True,
        use_transformer=False,
        strategy="weighted",
        use_tuning=False,
        use_lgbm=True,
        use_xgboost=False,
        weight_power=2.0
    ):
        self.use_lstm = use_lstm
        self.use_transformer = use_transformer
        self.strategy = strategy
        self.use_tuning = use_tuning
        self.use_lgbm = use_lgbm
        self.use_xgboost = use_xgboost
        self.weight_power = weight_power

        self.lgbm_model = None
        self.xgb_model = None
        self.lstm_model = None
        self.transformer_model = None
        self.ensemble = None

    # ---------------------------------------------------
    # FIT
    # ---------------------------------------------------
    def fit(self, X_train, y_train, X_val=None, y_val=None):
        from .base.lgbm_classifier import LGBMClassifier
        from .base.xgb_classifier import XGBClassifier

        models = []
        idx = 1

        # LightGBM
        if self.use_lgbm:
            logger.info(f"\n[{idx}] Training LightGBM…")
            self.lgbm_model = LGBMClassifier(use_tuning=self.use_tuning)
            self.lgbm_model.fit(X_train, y_train, X_val, y_val)
            models.append(self.lgbm_model)
            idx += 1

        # XGBoost
        if self.use_xgboost:
            logger.info(f"\n[{idx}] Training XGBoost…")
            self.xgb_model = XGBClassifier(use_tuning=self.use_tuning)
            self.xgb_model.fit(X_train, y_train, X_val, y_val)
            models.append(self.xgb_model)
            idx += 1

        # (User disabled deep models - we skip them)
        if self.use_lstm:
            logger.warning(
                "[QuantModel] LSTM disabled — not included in this rewrite.")

        # Build ensemble
        self.ensemble = EnsembleClassifier(models, strategy=self.strategy)

        # Compute weights for weighted ensemble
        if self.strategy == "weighted" and X_val is not None:
            self.ensemble.compute_weights(
                X_val, y_val, power=self.weight_power)

        # Stacking
        if self.strategy == "stacking":
            self.ensemble.fit_meta_model(X_train, y_train, X_val, y_val)

        logger.info("[QuantModel] Training complete.")
        return self

    def predict(self, X):
        return self.ensemble.predict(X)

    def predict_proba(self, X):
        return self.ensemble.predict_proba(X)

    def evaluate(self, X, y):
        return self.ensemble.evaluate(X, y)
