"""
LightGBM Return Predictor - Regression-based approach for better trading signals.

Instead of classifying into -1/0/+1, predict actual forward returns.
Then convert to trading signals based on predicted return magnitude.

Benefits:
1. Model learns actual return magnitudes, not arbitrary class labels
2. Can set trading threshold based on expected return (e.g., >1%)
3. Naturally filters for high-conviction trades
4. Sharpe-optimal: only trades when expected return justifies risk
"""

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import logging
import pickle

logger = logging.getLogger(__name__)


class LGBMReturnPredictor:
    """
    LightGBM model that predicts forward returns directly.
    Converts predictions to trading signals using return thresholds.
    """

    def __init__(
        self,
        long_threshold: float = 0.01,
        short_threshold: float = -0.01,
        use_gpu: bool = False
    ):
        """
        Args:
            long_threshold: Minimum predicted return to go long (e.g., 0.01 = 1%)
            short_threshold: Maximum predicted return to go short (e.g., -0.01 = -1%)
            use_gpu: Whether to use GPU for training
        """
        self.long_threshold = long_threshold
        self.short_threshold = short_threshold
        self.use_gpu = use_gpu

        self.params = {
            'objective': 'regression',
            'metric': 'mae',
            'learning_rate': 0.01,
            'num_leaves': 63,
            'max_depth': 8,
            'min_child_samples': 30,
            'subsample': 0.85,
            'colsample_bytree': 0.85,
            'reg_alpha': 0.05,
            'reg_lambda': 0.05,
            'random_state': 42,
            'n_jobs': -1,
            'verbosity': -1
        }

        if use_gpu:
            self.params['device'] = 'gpu'

        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None

    def fit(self, X, y_returns, X_val=None, y_val_returns=None):
        """
        Train the model on forward returns (not class labels).

        Args:
            X: Training features
            y_returns: Forward returns (e.g., df['forward_ret'])
            X_val: Validation features
            y_val_returns: Validation forward returns
        """
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Create LightGBM datasets
        train_data = lgb.Dataset(X_scaled, label=y_returns)

        valid_sets = [train_data]
        valid_names = ['train']

        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            val_data = lgb.Dataset(X_val_scaled, label=y_val_returns)
            valid_sets.append(val_data)
            valid_names.append('val')

        # Train
        self.model = lgb.train(
            self.params,
            train_data,
            num_boost_round=500,
            valid_sets=valid_sets,
            valid_names=valid_names,
            callbacks=[
                lgb.early_stopping(50),
                lgb.log_evaluation(50)
            ]
        )

        logger.info(
            f"[LGBM-Return] Best iteration: {self.model.best_iteration}")
        return self

    def predict_returns(self, X):
        """Predict raw forward returns."""
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict(self, X):
        """
        Predict trading signals (-1, 0, +1) based on predicted returns.

        Signal logic:
        - If predicted_return > long_threshold: +1 (long)
        - If predicted_return < short_threshold: -1 (short)
        - Otherwise: 0 (neutral)
        """
        pred_returns = self.predict_returns(X)

        signals = np.zeros(len(pred_returns))
        signals[pred_returns > self.long_threshold] = 1
        signals[pred_returns < self.short_threshold] = -1

        return signals.astype(int)

    def predict_proba(self, X):
        """
        Return pseudo-probabilities based on predicted returns.
        Maps returns to [0, 1] range for compatibility with existing code.
        """
        pred_returns = self.predict_returns(X)

        # Clip returns to reasonable range for sigmoid
        clipped = np.clip(pred_returns, -0.1, 0.1)

        # Sigmoid to get probability-like values
        # Scale factor for sensitivity
        prob_long = 1 / (1 + np.exp(-clipped * 50))
        prob_short = 1 - prob_long
        prob_neutral = 1 - np.abs(prob_long - 0.5) * 2

        return np.column_stack([prob_short, prob_neutral, prob_long])

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
            "params": self.params,
            "long_threshold": self.long_threshold,
            "short_threshold": self.short_threshold
        }
        with open(path, "wb") as f:
            pickle.dump(artifact, f)
        logger.info(f"[LGBM-Return] Saved to {path}")

    @classmethod
    def load(cls, path):
        with open(path, "rb") as f:
            artifact = pickle.load(f)

        instance = cls(
            long_threshold=artifact.get("long_threshold", 0.01),
            short_threshold=artifact.get("short_threshold", -0.01)
        )
        instance.model = artifact["model"]
        instance.scaler = artifact["scaler"]
        instance.feature_names = artifact.get("feature_names")
        instance.params = artifact.get("params", instance.params)

        return instance
