"""
LightGBM Return Predictor Tuner
Optimizes regression model hyperparameters for financial metrics (Sharpe ratio).

Unlike classification tuners that optimize F1, this tuner:
1. Trains regression models to predict forward returns
2. Converts predictions to trading signals using thresholds
3. Optimizes for Sharpe ratio (risk-adjusted returns)
"""

import optuna
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)

optuna.logging.set_verbosity(optuna.logging.WARNING)


class LGBMReturnTuner:
    """
    Hyperparameter tuner for LGBMReturnPredictor.
    Optimizes for Sharpe ratio instead of classification metrics.
    """

    def __init__(
        self,
        n_trials: int = 30,
        forward_periods: int = 10,
        transaction_cost_bps: float = 10.0,
        use_gpu: bool = False
    ):
        """
        Args:
            n_trials: Number of Optuna trials
            forward_periods: Forward look period for threshold scaling
            transaction_cost_bps: Transaction costs in basis points
            use_gpu: Whether to use GPU for training
        """
        self.n_trials = n_trials
        self.forward_periods = forward_periods
        self.transaction_cost = transaction_cost_bps / 10000
        self.use_gpu = use_gpu
        self.study = None
        self.best_params = None
        self.best_threshold = None

    def _calculate_sharpe(self, returns: np.ndarray) -> float:
        """Calculate annualized Sharpe ratio from daily returns"""
        if len(returns) < 2:
            return -10.0

        returns = returns[~np.isnan(returns) & ~np.isinf(returns)]
        if len(returns) < 2 or np.std(returns) < 1e-8:
            return -10.0

        # Annualized Sharpe (assuming 252 trading days)
        mean_ret = np.mean(returns)
        std_ret = np.std(returns, ddof=1)
        sharpe = (mean_ret / std_ret) * np.sqrt(252)

        return float(np.clip(sharpe, -10, 10))

    def _simulate_trading(
        self,
        predictions: np.ndarray,
        forward_returns: np.ndarray,
        long_threshold: float,
        short_threshold: float
    ) -> np.ndarray:
        """Simulate trading and return strategy returns"""
        # Generate signals
        signals = np.zeros(len(predictions))
        signals[predictions > long_threshold] = 1
        signals[predictions < short_threshold] = -1

        # Strategy returns
        gross_returns = signals * forward_returns

        # Transaction costs on position changes
        position_changes = np.abs(np.diff(signals, prepend=0))
        costs = position_changes * self.transaction_cost

        return gross_returns - costs

    def objective(self, trial, X_train, y_train, X_val, y_val):
        """Optuna objective: maximize Sharpe ratio"""

        # Hyperparameter search space
        params = {
            'objective': 'regression',
            'metric': 'mae',
            'learning_rate': trial.suggest_float('learning_rate', 0.005, 0.1, log=True),
            'num_leaves': trial.suggest_int('num_leaves', 16, 128),
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'min_child_samples': trial.suggest_int('min_child_samples', 20, 200),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'reg_alpha': trial.suggest_float('reg_alpha', 1e-4, 10.0, log=True),
            'reg_lambda': trial.suggest_float('reg_lambda', 1e-4, 10.0, log=True),
            'min_gain_to_split': trial.suggest_float('min_gain_to_split', 0.0, 1.0),
            'verbosity': -1,
            'force_col_wise': True,
            'deterministic': True,
            'num_threads': -1,
        }

        if self.use_gpu:
            params['device_type'] = 'gpu'

        # Threshold scale factor for adaptive thresholds
        # Higher = fewer but stronger signals, Lower = more signals
        threshold_scale = trial.suggest_float('threshold_scale', 0.2, 1.5)

        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled = scaler.transform(X_val)

        # Create datasets
        train_data = lgb.Dataset(X_train_scaled, label=y_train)
        val_data = lgb.Dataset(X_val_scaled, label=y_val, reference=train_data)

        # Train model
        model = lgb.train(
            params,
            train_data,
            valid_sets=[train_data, val_data],
            num_boost_round=500,
            callbacks=[
                lgb.early_stopping(30, verbose=False),
            ]
        )

        # Predict on validation
        predictions = model.predict(X_val_scaled)

        # Adaptive threshold based on prediction distribution
        pred_mean = np.mean(predictions)
        pred_std = np.std(predictions)

        long_thresh = pred_mean + threshold_scale * pred_std
        short_thresh = pred_mean - threshold_scale * pred_std

        # Generate signals (only short if prediction is negative)
        signals = np.zeros(len(predictions))
        signals[predictions > long_thresh] = 1
        signals[(predictions < short_thresh) & (predictions < 0)] = -1

        # Calculate strategy returns
        gross_returns = signals * y_val
        position_changes = np.abs(np.diff(signals, prepend=0))
        costs = position_changes * self.transaction_cost
        strategy_returns = gross_returns - costs

        sharpe = self._calculate_sharpe(strategy_returns)

        return sharpe

    def tune(self, X_train, y_train, X_val, y_val):
        """
        Run hyperparameter optimization.

        Args:
            X_train: Training features
            y_train: Training forward returns
            X_val: Validation features
            y_val: Validation forward returns

        Returns:
            Dictionary of best hyperparameters
        """
        def _objective(trial):
            return self.objective(trial, X_train, y_train, X_val, y_val)

        self.study = optuna.create_study(direction='maximize')
        self.study.optimize(
            _objective,
            n_trials=self.n_trials,
            show_progress_bar=True,
            n_jobs=1
        )

        # Extract best params (exclude threshold_scale from model params)
        best_trial = self.study.best_trial
        self.best_params = {
            k: v for k, v in best_trial.params.items()
            if k != 'threshold_scale'
        }

        # Add fixed params
        self.best_params.update({
            'objective': 'regression',
            'metric': 'mae',
            'verbosity': -1,
            'force_col_wise': True,
            'deterministic': True,
            'num_threads': -1,
        })

        # Get best threshold scale
        self.best_threshold_scale = best_trial.params.get(
            'threshold_scale', 0.5)

        logger.info(f"[Return Tuner] Best Trial: {best_trial.number}")
        logger.info(f"[Return Tuner] Best Sharpe: {self.study.best_value:.4f}")
        logger.info(
            f"[Return Tuner] Best Threshold Scale: {self.best_threshold_scale:.2f}")

        return self.best_params, self.best_threshold_scale

    def get_best_threshold(self) -> float:
        """Return the optimized trading threshold"""
        return self.best_threshold if self.best_threshold else 0.01
