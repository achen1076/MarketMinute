"""
Ensemble classifier combining LightGBM with deep learning models.
Achieves better performance than individual models.
"""
import numpy as np
import pandas as pd
import pickle
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from .base.lgbm_classifier import LGBMClassifier

# Optional imports
try:
    from .base.xgb_classifier import XGBClassifier
except ImportError:
    XGBClassifier = None

try:
    from .deep_learning import LSTMClassifier, TransformerClassifier
except ImportError:
    LSTMClassifier = None
    TransformerClassifier = None

logger = logging.getLogger(__name__)


class EnsembleClassifier:
    """
    Ensemble classifier combining multiple models.

    Strategies:
    - 'average': Average probabilities from all models
    - 'weighted': Weighted average based on validation performance
    - 'stacking': Train meta-learner on model predictions
    - 'voting': Majority vote on predicted classes
    """

    def __init__(
        self,
        models: List[Any],
        strategy: str = 'weighted',  # 'average', 'weighted', 'stacking', 'voting'
        weights: Optional[List[float]] = None
    ):
        """
        Initialize ensemble.

        Args:
            models: List of fitted models (LGBMClassifier, LSTMClassifier, etc.)
            strategy: Ensemble strategy
            weights: Custom weights for weighted average (if None, computed from validation)
        """
        self.models = models
        self.strategy = strategy
        self.weights = weights
        self.validation_scores = None
        self.meta_model = None

        if strategy == 'weighted' and weights is None:
            logger.warning(
                "Weighted strategy without weights - will use equal weights until compute_weights is called")
            self.weights = [1.0 / len(models)] * len(models)

    def compute_weights(self, X_val, y_val):
        """Compute optimal weights based on validation performance."""
        scores = [accuracy_score(y_val, model.predict(X_val)) for model in self.models]
        self.validation_scores = scores
        total_score = sum(scores)
        self.weights = [s / total_score for s in scores]
        logger.info(f"Weights: {[f'{w:.3f}' for w in self.weights]} | Scores: {[f'{s:.3f}' for s in scores]}")

    def fit_meta_model(self, X_train, y_train, X_val=None, y_val=None):
        """Fit meta-model for stacking strategy."""
        base_predictions = [model.predict_proba(X_train) for model in self.models]
        X_meta = np.hstack(base_predictions)

        self.meta_model = LGBMClassifier(params={
            'objective': 'multiclass',
            'num_class': 3,
            'learning_rate': 0.05,
            'num_leaves': 15,
            'max_depth': 3,
            'verbosity': -1
        })

        if X_val is not None and y_val is not None:
            base_val_predictions = [model.predict_proba(X_val) for model in self.models]
            X_meta_val = np.hstack(base_val_predictions)
            self.meta_model.fit(X_meta, y_train, X_meta_val, y_val)
        else:
            self.meta_model.fit(X_meta, y_train)

        logger.info("Meta-model fitted for stacking")

    def predict_proba(self, X) -> np.ndarray:
        """Predict probabilities using ensemble."""
        all_probas = [model.predict_proba(X) for model in self.models]

        if self.strategy == 'average':
            return np.mean(all_probas, axis=0)
        elif self.strategy == 'weighted':
            return sum(w * p for w, p in zip(self.weights, all_probas))
        elif self.strategy == 'stacking':
            X_meta = np.hstack(all_probas)
            return self.meta_model.predict_proba(X_meta)
        elif self.strategy == 'voting':
            all_preds = np.array([np.argmax(p, axis=1) for p in all_probas]).T
            ensemble_proba = np.zeros_like(all_probas[0])
            for i, preds in enumerate(all_preds):
                votes = np.bincount(preds, minlength=3)
                ensemble_proba[i] = votes / len(self.models)
            return ensemble_proba
        else:
            raise ValueError(f"Unknown strategy: {self.strategy}")

    def predict(self, X) -> np.ndarray:
        """Predict class labels using ensemble."""
        probas = self.predict_proba(X)
        labels = np.argmax(probas, axis=1)
        label_map = {0: -1, 1: 0, 2: 1}
        return np.array([label_map[l] for l in labels])

    def get_model_contributions(self, X) -> Dict[str, np.ndarray]:
        """Get individual model predictions for analysis."""
        return {
            f"{model.__class__.__name__}_{i}": model.predict_proba(X)
            for i, model in enumerate(self.models)
        }

    def evaluate(self, X, y) -> Dict[str, Any]:
        """Evaluate ensemble and individual models."""
        y_pred_ensemble = self.predict(X)
        
        results = {
            'ensemble': {
                'accuracy': accuracy_score(y, y_pred_ensemble),
                'precision': precision_score(y, y_pred_ensemble, average='macro', zero_division=0),
                'recall': recall_score(y, y_pred_ensemble, average='macro', zero_division=0),
                'f1': f1_score(y, y_pred_ensemble, average='macro', zero_division=0)
            },
            'individual_models': [
                {
                    'model': f"{model.__class__.__name__}_{i}",
                    'accuracy': accuracy_score(y, model.predict(X)),
                    'precision': precision_score(y, model.predict(X), average='macro', zero_division=0),
                    'recall': recall_score(y, model.predict(X), average='macro', zero_division=0),
                    'f1': f1_score(y, model.predict(X), average='macro', zero_division=0)
                }
                for i, model in enumerate(self.models)
            ]
        }
        return results


class QuantModel:
    """
    Pre-configured ensemble combining gradient boosting (LGBM/XGBoost) with deep learning.
    Optimized for quantitative trading.
    """

    def __init__(
        self,
        use_lstm: bool = True,
        use_transformer: bool = False,
        strategy: str = 'weighted',
        use_tuning: bool = False,
        use_lgbm: bool = True,
        use_xgboost: bool = False
    ):
        """
        Initialize Quant Model ensemble.

        Args:
            use_lstm: Include LSTM model
            use_transformer: Include Transformer model
            strategy: Ensemble strategy
            use_tuning: Enable hyperparameter tuning for gradient boosting models
            use_lgbm: Use LightGBM model
            use_xgboost: Use XGBoost model
        """
        self.use_lstm = use_lstm
        self.use_transformer = use_transformer
        self.strategy = strategy
        self.use_tuning = use_tuning
        self.use_lgbm = use_lgbm
        self.use_xgboost = use_xgboost

        self.lgbm_model = None
        self.xgb_model = None
        self.lstm_model = None
        self.transformer_model = None
        self.ensemble = None

    def fit(self, X_train, y_train, X_val=None, y_val=None):
        """Train all models and create ensemble."""
        logger.info("Training ensemble models...")
        models = []
        step = 1

        if self.use_lgbm:
            logger.info(f"{step}. Training LightGBM...")
            self.lgbm_model = LGBMClassifier(use_tuning=self.use_tuning, use_gpu=False)
            self.lgbm_model.fit(X_train, y_train, X_val, y_val)
            models.append(self.lgbm_model)
            step += 1

        if self.use_xgboost:
            logger.info(f"{step}. Training XGBoost...")
            self.xgb_model = XGBClassifier(use_tuning=self.use_tuning, use_gpu=False)
            self.xgb_model.fit(X_train, y_train, X_val, y_val)
            models.append(self.xgb_model)
            step += 1

        if self.use_lstm and len(X_train) >= 120:
            logger.info(f"{step}. Training LSTM...")
            self.lstm_model = LSTMClassifier(
                hidden_dim=128, num_layers=2, epochs=50, patience=10, sequence_length=20
            )
            self.lstm_model.fit(X_train, y_train, X_val, y_val)
            models.append(self.lstm_model)
            step += 1

        if self.use_transformer and len(X_train) >= 130:
            logger.info(f"{step}. Training Transformer...")
            self.transformer_model = TransformerClassifier(
                d_model=128, nhead=8, num_layers=4, epochs=50, patience=10, sequence_length=30
            )
            self.transformer_model.fit(X_train, y_train, X_val, y_val)
            models.append(self.transformer_model)
            step += 1

        logger.info(f"{step}. Creating {self.strategy} ensemble...")
        self.ensemble = EnsembleClassifier(models, strategy=self.strategy)

        if self.strategy == 'weighted' and X_val is not None:
            self.ensemble.compute_weights(X_val, y_val)
        elif self.strategy == 'stacking':
            self.ensemble.fit_meta_model(X_train, y_train, X_val, y_val)

        logger.info("✓ Complete")
        return self

    def predict(self, X):
        """Predict using ensemble."""
        return self.ensemble.predict(X)

    def predict_proba(self, X):
        """Predict probabilities using ensemble."""
        return self.ensemble.predict_proba(X)

    def evaluate(self, X, y):
        """Evaluate ensemble."""
        return self.ensemble.evaluate(X, y)

    def save(self, path: str):
        """Save ensemble models."""
        Path(path).parent.mkdir(parents=True, exist_ok=True)

        if self.lgbm_model:
            self.lgbm_model.save(f"{path}_lgbm.pkl")
        if self.xgb_model:
            self.xgb_model.save(f"{path}_xgb.pkl")
        if self.lstm_model:
            self.lstm_model.save(f"{path}_lstm.pth")
        if self.transformer_model:
            self.transformer_model.save(f"{path}_transformer.pth")

        config = {
            'use_lstm': self.use_lstm,
            'use_transformer': self.use_transformer,
            'use_lgbm': self.use_lgbm,
            'use_xgboost': self.use_xgboost,
            'strategy': self.strategy,
            'weights': self.ensemble.weights
        }
        with open(f"{path}_config.pkl", 'wb') as f:
            pickle.dump(config, f)

        logger.info(f"Saved to {path}")


# Backwards compatibility alias
LGBMDeepLearningEnsemble = QuantModel
