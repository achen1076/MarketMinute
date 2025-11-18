"""
Hyperparameter tuning for LightGBM using Optuna.
Binary classification with AUC optimization and time-series CV.
Conservative parameter ranges for financial data.
"""
import optuna
import lightgbm as lgb
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score
import logging

logger = logging.getLogger(__name__)


def suggest_lgbm_params_binary(trial, use_gpu: bool = False):
    """
    Conservative LightGBM search space for binary classification on daily bars.
    Optimized for financial time series with class imbalance handling.
    
    Args:
        trial: Optuna trial object
        use_gpu: Whether to use GPU acceleration
        
    Returns:
        dict: Parameter suggestions for this trial
    """
    params = {
        "objective": "binary",
        "metric": "auc",
        "boosting_type": "gbdt",
        "verbosity": -1,
        
        # Learning
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.1, log=True),
        
        # Tree structure (conservative for financial data)
        "num_leaves": trial.suggest_int("num_leaves", 8, 64),
        "max_depth": trial.suggest_int("max_depth", 3, 8),
        "min_data_in_leaf": trial.suggest_int("min_data_in_leaf", 30, 300),
        
        # Sampling (regularization)
        "feature_fraction": trial.suggest_float("feature_fraction", 0.6, 1.0),
        "bagging_fraction": trial.suggest_float("bagging_fraction", 0.6, 1.0),
        "bagging_freq": trial.suggest_int("bagging_freq", 1, 10),
        
        # L1/L2 regularization
        "lambda_l1": trial.suggest_float("lambda_l1", 1e-3, 10.0, log=True),
        "lambda_l2": trial.suggest_float("lambda_l2", 1e-3, 10.0, log=True),
        "min_gain_to_split": trial.suggest_float("min_gain_to_split", 0.0, 5.0),
        
        # Class imbalance handling
        "scale_pos_weight": trial.suggest_float("scale_pos_weight", 0.5, 5.0),
    }
    
    if use_gpu:
        params["device_type"] = "gpu"
    
    return params


class LGBMHyperparameterTuner:
    """Bayesian hyperparameter optimization for LightGBM."""
    
    def __init__(self, n_trials=30, cv_folds=5, random_state=42, use_gpu='auto'):
        """
        Initialize tuner.
        
        Args:
            n_trials: Number of optimization trials (reduced to 30 for speed)
            cv_folds: Number of cross-validation folds (5 for time-series)
            random_state: Random seed
            use_gpu: GPU mode - 'auto' (detect), True (force), False (disable)
        """
        self.n_trials = n_trials
        self.cv_folds = cv_folds
        self.random_state = random_state
        
        if use_gpu == 'auto':
            from .base.lgbm_classifier import check_gpu_available
            self.use_gpu = check_gpu_available()
        else:
            self.use_gpu = use_gpu
            
        self.best_params = None
        self.study = None
    
    def objective(self, trial, X, y):
        """
        Objective function for Optuna using TimeSeriesSplit and AUC.
        
        Args:
            trial: Optuna trial object
            X: Training features
            y: Training labels (mapped to 0/1)
            
        Returns:
            Negative mean AUC (we minimize, so negate to maximize AUC)
        """
        # Get conservative binary classification parameters
        params = suggest_lgbm_params_binary(trial, use_gpu=self.use_gpu)
        
        # Handle pandas or numpy
        X_values = X.values if hasattr(X, "values") else X
        y_values = y.values if hasattr(y, "values") else y
        
        # Time series cross-validation (no shuffle!)
        tscv = TimeSeriesSplit(n_splits=self.cv_folds)
        auc_scores = []
        
        for train_idx, valid_idx in tscv.split(X_values):
            X_train, X_valid = X_values[train_idx], X_values[valid_idx]
            y_train, y_valid = y_values[train_idx], y_values[valid_idx]
            
            # Create datasets
            train_set = lgb.Dataset(X_train, label=y_train)
            valid_set = lgb.Dataset(X_valid, label=y_valid)
            
            # Train with early stopping
            model = lgb.train(
                params,
                train_set,
                num_boost_round=1000,
                valid_sets=[valid_set],
                valid_names=["valid"],
                callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
            )
            
            # Get AUC score
            auc_scores.append(model.best_score["valid"]["auc"])
        
        # Return negative mean AUC (minimize negative = maximize AUC)
        return -float(np.mean(auc_scores))
    
    def tune(self, X, y):
        """
        Run hyperparameter optimization for binary classification.
        
        Args:
            X: Training features
            y: Training labels (already mapped to 0, 1 for binary)
            
        Returns:
            dict: Best hyperparameters found
        """
        logger.info(f"Starting Bayesian optimization ({self.n_trials} trials, {self.cv_folds}-fold TimeSeriesCV)...")
        logger.info(f"Optimizing for AUC on binary classification...")
        
        # Create study (minimize negative AUC = maximize AUC)
        self.study = optuna.create_study(
            direction='minimize',
            sampler=optuna.samplers.TPESampler(seed=self.random_state)
        )
        
        # Optimize
        self.study.optimize(
            lambda trial: self.objective(trial, X, y),
            n_trials=self.n_trials,
            show_progress_bar=True
        )
        
        # Get best parameters
        self.best_params = self.study.best_params
        
        # Add fixed parameters for binary classification
        self.best_params.update({
            'objective': 'binary',
            'metric': 'auc',
            'boosting_type': 'gbdt',
            'verbosity': -1,
            'random_state': self.random_state,
        })
        
        # Log results (remember we negated AUC, so negate back)
        best_auc = -self.study.best_value
        logger.info(f"Best validation AUC: {best_auc:.4f}")
        logger.info(f"Best parameters: {self.best_params}")
        
        return self.best_params
    
    def get_feature_importance(self):
        """Get parameter importance from optimization history."""
        if self.study is None:
            return None
        
        try:
            importance = optuna.importance.get_param_importances(self.study)
            return importance
        except:
            return None
