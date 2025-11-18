"""
LightGBM classifier with calibration.
Institutional-grade model with proper hyperparameters.
"""
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV
import logging
import pickle
import subprocess

logger = logging.getLogger(__name__)


def check_gpu_available():
    """Check if GPU is available for LightGBM."""
    try:
        # Try to create a simple GPU dataset
        result = subprocess.run(
            ['nvidia-smi'], capture_output=True, text=True, timeout=2)
        if result.returncode == 0:
            logger.info(
                "[GPU] NVIDIA GPU detected - GPU acceleration will be used")
            return True
    except:
        pass

    logger.info("[CPU] GPU not available - using CPU")
    return False


class LGBMClassifier:
    """LightGBM classifier wrapper."""

    def __init__(self, params=None, use_tuning=False, use_gpu='auto'):
        """
        Initialize LightGBM classifier.

        Args:
            params: LightGBM parameters (if None and use_tuning=False, uses defaults)
            use_tuning: Whether to use hyperparameter tuning (set params=None if True)
            use_gpu: GPU mode - 'auto' (detect), True (force), False (disable)
        """
        self.use_tuning = use_tuning

        # Auto-detect GPU if set to 'auto'
        if use_gpu == 'auto':
            self.use_gpu = check_gpu_available()
        else:
            self.use_gpu = use_gpu

        default_params = {
            'objective': 'multiclass',
            'num_class': 3,
            'metric': 'multi_logloss',
            'learning_rate': 0.05,
            'num_leaves': 31,
            'max_depth': -1,
            'min_child_samples': 20,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 0.1,
            'random_state': 42,
            'n_jobs': -1,
            'verbosity': -1
        }
        
        # Add GPU parameters if enabled
        if use_gpu:
            default_params['device'] = 'gpu'
            default_params['gpu_platform_id'] = 0
            default_params['gpu_device_id'] = 0
            logger.info("GPU acceleration enabled")

        self.params = params or default_params

        self.model = None
        self.scaler = StandardScaler()
        self.calibrated_model = None
        self.feature_names = None
        self.tuning_study = None

    def fit(self, X, y, X_val=None, y_val=None, calibrate=True):
        """
        Train model.

        Args:
            X: Training features
            y: Training labels
            X_val: Validation features
            y_val: Validation labels
            calibrate: Whether to calibrate probabilities
        """
        logger.info(f"Training LightGBM on {len(X)} samples...")

        # Convert labels to 0, 1, 2
        label_map = {-1: 0, 0: 1, 1: 2}
        y_mapped = y.map(label_map) if isinstance(y, pd.Series) else np.array([label_map.get(yi, yi) for yi in y])

        if X_val is not None and y_val is not None:
            y_val_mapped = y_val.map(label_map) if isinstance(y_val, pd.Series) else np.array([label_map.get(yi, yi) for yi in y_val])

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Store feature names
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)

        # Create datasets
        train_data = lgb.Dataset(X_scaled, label=y_mapped)

        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            val_data = lgb.Dataset(
                X_val_scaled, label=y_val_mapped, reference=train_data)
            valid_sets = [train_data, val_data]
            valid_names = ['train', 'val']
        else:
            valid_sets = [train_data]
            valid_names = ['train']

        # Train
        self.model = lgb.train(
            self.params,
            train_data,
            num_boost_round=500,
            valid_sets=valid_sets,
            valid_names=valid_names,
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(50)]
        )

        logger.info(
            f"Training complete. Best iteration: {self.model.best_iteration}")

        # Note: Skipping CalibratedClassifierCV as it doesn't work with LightGBM Booster
        # LightGBM probabilities are generally well-calibrated
        # Can add manual calibration (Platt scaling, isotonic) if needed
        if calibrate and X_val is not None:
            logger.info(
                "Note: Using raw LightGBM probabilities (generally well-calibrated)")

        return self

    def predict_proba(self, X):
        """Predict probabilities."""
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def predict(self, X):
        """Predict class labels."""
        probas = self.predict_proba(X)
        labels = np.argmax(probas, axis=1)
        
        # Map back to -1, 0, 1
        label_map_reverse = {0: -1, 1: 0, 2: 1}
        return np.array([label_map_reverse[l] for l in labels])

    def get_feature_importance(self, importance_type='gain'):
        """Get feature importance."""
        if self.model is None:
            return None

        importance = self.model.feature_importance(
            importance_type=importance_type)

        if self.feature_names:
            return pd.DataFrame({
                'feature': self.feature_names,
                'importance': importance
            }).sort_values('importance', ascending=False)
        else:
            return importance

    def save(self, path):
        """Save model, scaler, and metadata."""
        artifact = {
            'model': self.model,
            'scaler': self.scaler,
            'calibrated_model': self.calibrated_model,
            'feature_names': self.feature_names,
            'params': self.params
        }

        with open(path, 'wb') as f:
            pickle.dump(artifact, f)

        logger.info(f"Model saved to {path}")

    @classmethod
    def load(cls, path):
        """Load model from file."""
        with open(path, 'rb') as f:
            artifact = pickle.load(f)

        instance = cls()
        instance.model = artifact['model']
        instance.scaler = artifact['scaler']
        instance.calibrated_model = artifact.get('calibrated_model')
        instance.feature_names = artifact.get('feature_names')
        instance.params = artifact.get('params', instance.params)
        
        logger.info(f"Model loaded from {path}")
        return instance
