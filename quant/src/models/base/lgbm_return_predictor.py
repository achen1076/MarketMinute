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
        long_threshold: float = 0.018,
        short_threshold: float = -0.018,
        use_gpu: bool = False
    ):
        """
        Args:
            long_threshold: Minimum predicted return to go long (e.g., 0.018 = 1.8% for 5-day)
            short_threshold: Maximum predicted return to go short (e.g., -0.018 = -1.8% for 5-day)
            use_gpu: Whether to use GPU for training
        """
        self.long_threshold = long_threshold
        self.short_threshold = short_threshold
        self.use_gpu = use_gpu

        # Huber loss is less dominated by fat-tail outliers than MAE/MSE on
        # return targets, and smaller trees keep the weak signal from being
        # swamped by noise (MAE at lr=0.01 routinely early-stopped at iter 1).
        self.params = {
            'objective': 'huber',
            'metric': 'huber',
            'learning_rate': 0.02,
            'num_leaves': 15,
            'max_depth': 4,
            'min_child_samples': 60,
            'subsample': 0.7,
            'subsample_freq': 1,
            'colsample_bytree': 0.7,
            'reg_alpha': 1.0,
            'reg_lambda': 2.0,
            'random_state': 42,
            'n_jobs': -1,
            'verbosity': -1
        }

        if use_gpu:
            self.params['device'] = 'gpu'

        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        # Training-set prediction distribution for threshold calibration
        self._train_pred_mean = 0.0
        self._train_pred_std = 0.01
        self._best_iteration = 0
        self._is_degenerate = False

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
            num_boost_round=300,
            valid_sets=valid_sets,
            valid_names=valid_names,
            callbacks=[
                lgb.early_stopping(50),
                lgb.log_evaluation(50)
            ]
        )

        # Calibrate adaptive thresholds from training predictions (no lookahead)
        train_preds = self.model.predict(X_scaled)
        self._train_pred_mean = float(np.mean(train_preds))
        self._train_pred_std = float(max(np.std(train_preds), 1e-6))
        self._best_iteration = self.model.best_iteration

        # Degenerate model detection: if the model barely learned (<=3 rounds)
        # or predictions are near-constant, trading on this model is trading
        # on noise. With vol-normalized targets, std < 0.05 means constant.
        # With raw returns, std < 0.002 means constant.
        self._is_degenerate = (
            self._best_iteration <= 3 or
            self._train_pred_std < 0.05
        )

        logger.info(
            f"[LGBM-Return] Best iteration: {self._best_iteration}")
        logger.info(
            f"[LGBM-Return] Train pred dist: mean={self._train_pred_mean:.4f}, std={self._train_pred_std:.4f}")
        if self._is_degenerate:
            logger.warning(
                f"[LGBM-Return] DEGENERATE model detected "
                f"(iter={self._best_iteration}, std={self._train_pred_std:.6f}). "
                f"Will predict no trades.")
        return self

    def predict_returns(self, X):
        """Predict raw forward returns."""
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict(self, X, threshold_scale=None):
        """
        Predict trading signals (-1, 0, +1) based on predicted returns.

        Uses adaptive threshold calibrated from TRAINING predictions:
        - Long if prediction > train_mean + scale*train_std
        - Short if prediction < train_mean - scale*train_std AND negative

        No test-set lookahead: thresholds are fixed at training time.
        Works identically for batch evaluation and single-bar production.
        """
        # Degenerate model: predictions are near-constant noise.
        # Returning no trades is strictly better than trading on noise.
        if getattr(self, '_is_degenerate', False):
            return np.zeros(len(X) if hasattr(X, '__len__') else X.shape[0], dtype=int)

        pred_returns = self.predict_returns(X)
        signals = np.zeros(len(pred_returns))

        if threshold_scale is None:
            threshold_scale = getattr(self, 'threshold_scale', 0.5)

        # Use training-set distribution (calibrated during fit, no lookahead)
        pred_mean = self._train_pred_mean
        pred_std = self._train_pred_std

        # Long: prediction significantly above training average
        long_thresh = pred_mean + threshold_scale * pred_std
        signals[pred_returns > long_thresh] = 1

        # Short: prediction significantly below training average AND negative
        short_thresh = pred_mean - threshold_scale * pred_std
        signals[(pred_returns < short_thresh) & (pred_returns < 0)] = -1

        # No fallback: if thresholds produce zero signals, that means the
        # model has no edge. Forcing trades would be trading on noise.

        return signals.astype(int)

    def predict_proba(self, X):
        """
        Pseudo-probabilities [down, neutral, up] anchored to the calibrated
        decision rule: the directional probability crosses 0.65 exactly where
        predict() starts trading, and rises/falls 2 logits per train-std of edge.
        (The old raw-return sigmoid saturated at ~0.99 on vol-normalized targets.)
        """
        n = len(X) if hasattr(X, '__len__') else X.shape[0]
        if getattr(self, '_is_degenerate', False):
            return np.tile([0.1, 0.8, 0.1], (n, 1))

        pred = self.predict_returns(X)
        z = (pred - self._train_pred_mean) / self._train_pred_std
        scale = getattr(self, 'threshold_scale', 0.5)
        edge = np.abs(z) - scale
        p_dir = 1 / (1 + np.exp(-(2 * edge + np.log(0.65 / 0.35))))
        # predict() only shorts when the raw prediction is also negative
        short_blocked = (z < 0) & (pred >= 0)
        p_dir = np.where(short_blocked, np.minimum(p_dir, 0.5), p_dir)
        rest = 1 - p_dir
        p_up = np.where(z >= 0, p_dir, 0.2 * rest)
        p_down = np.where(z < 0, p_dir, 0.2 * rest)
        return np.column_stack([p_down, 0.8 * rest, p_up])

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
            "short_threshold": self.short_threshold,
            "train_pred_mean": self._train_pred_mean,
            "train_pred_std": self._train_pred_std,
            "best_iteration": self._best_iteration,
            "is_degenerate": self._is_degenerate
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
        instance._train_pred_mean = artifact.get("train_pred_mean", 0.0)
        instance._train_pred_std = artifact.get("train_pred_std", 0.01)
        instance._best_iteration = artifact.get("best_iteration", 0)
        instance._is_degenerate = artifact.get("is_degenerate", False)

        return instance
