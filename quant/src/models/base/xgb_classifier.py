"""
XGBoost classifier for multi-class classification.
Institutional grade model with proper hyperparameters.
"""
import xgboost as xgb
import numpy as np
import pandas as pd
import pickle
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)


class XGBClassifier:
    """XGBoost classifier wrapper."""
    
    def __init__(self, params=None, use_tuning=False, use_gpu=False):
        """
        Initialize XGBoost classifier.
        
        Args:
            params: XGBoost parameters (if None and use_tuning=False, uses defaults)
            use_tuning: Whether to use hyperparameter tuning (set params=None if True)
            use_gpu: GPU mode - True (enable), False (disable)
        """
        self.use_tuning = use_tuning
        self.use_gpu = use_gpu
        
        default_params = {
            'objective': 'multi:softprob',
            'num_class': 3,
            'eval_metric': 'mlogloss',
            'learning_rate': 0.05,
            'max_depth': 6,
            'min_child_weight': 1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 0.1,
            'random_state': 42,
            'n_jobs': -1,
            'verbosity': 0
        }
        
        # Add GPU parameters if enabled
        if use_gpu:
            default_params['tree_method'] = 'gpu_hist'
            default_params['gpu_id'] = 0
            logger.info("GPU acceleration enabled")
        else:
            default_params['tree_method'] = 'hist'
        
        self.params = params or default_params
        
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.tuning_study = None
    
    def fit(self, X, y, X_val=None, y_val=None):
        """
        Train model.
        
        Args:
            X: Training features
            y: Training labels
            X_val: Validation features
            y_val: Validation labels
        """
        logger.info(f"Training XGBoost on {len(X)} samples...")
        
        # Convert labels to 0, 1, 2
        label_map = {-1: 0, 0: 1, 1: 2}
        y_mapped = (
            y.map(label_map)
            if isinstance(y, pd.Series)
            else np.array([label_map.get(yi, yi) for yi in y])
        )
        
        # Hyperparameter tuning if enabled
        if self.use_tuning:
            from ..xgb_hyperparameter_tuner import XGBHyperparameterTuner
            logger.info("Running hyperparameter optimization...")
            tuner = XGBHyperparameterTuner(n_trials=50, cv_folds=3, use_gpu=self.use_gpu)
            self.params = tuner.tune(X, y_mapped)
            self.tuning_study = tuner.study
            logger.info("[DONE] Hyperparameter tuning complete")
        
        if X_val is not None and y_val is not None:
            y_val_mapped = (
                y_val.map(label_map)
                if isinstance(y_val, pd.Series)
                else np.array([label_map.get(yi, yi) for yi in y_val])
            )
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Store feature names
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)
        
        # Create DMatrix
        dtrain = xgb.DMatrix(X_scaled, label=y_mapped)
        
        evals = [(dtrain, 'train')]
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            dval = xgb.DMatrix(X_val_scaled, label=y_val_mapped)
            evals.append((dval, 'val'))
        
        # Train
        self.model = xgb.train(
            self.params,
            dtrain,
            num_boost_round=500,
            evals=evals,
            early_stopping_rounds=50,
            verbose_eval=50
        )
        
        logger.info(f"Training complete. Best iteration: {self.model.best_iteration}")
        
        return self
    
    def predict_proba(self, X):
        """Predict probabilities."""
        X_scaled = self.scaler.transform(X)
        dmatrix = xgb.DMatrix(X_scaled)
        return self.model.predict(dmatrix)
    
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
        
        importance = self.model.get_score(importance_type=importance_type)
        
        if self.feature_names:
            # Map f0, f1, etc to feature names
            importance_mapped = {}
            for key, value in importance.items():
                if key.startswith('f'):
                    idx = int(key[1:])
                    if idx < len(self.feature_names):
                        importance_mapped[self.feature_names[idx]] = value
                else:
                    importance_mapped[key] = value
            
            return pd.DataFrame({
                'feature': list(importance_mapped.keys()),
                'importance': list(importance_mapped.values())
            }).sort_values('importance', ascending=False)
        else:
            return importance
    
    def save(self, path):
        """Save model, scaler, and metadata."""
        artifact = {
            'model': self.model,
            'scaler': self.scaler,
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
        instance.feature_names = artifact.get('feature_names')
        instance.params = artifact.get('params', instance.params)
        
        logger.info(f"Model loaded from {path}")
        return instance
