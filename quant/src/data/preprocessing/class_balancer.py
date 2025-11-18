"""
Class balancing techniques for imbalanced datasets.
"""
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE, ADASYN
from imblearn.under_sampling import RandomUnderSampler
from imblearn.combine import SMOTETomek, SMOTEENN
from sklearn.utils.class_weight import compute_class_weight
import logging

logger = logging.getLogger(__name__)


class ClassBalancer:
    """Handle imbalanced classification datasets."""
    
    def __init__(self, strategy='smote', random_state=42):
        """
        Initialize class balancer.
        
        Args:
            strategy: 'smote', 'adasyn', 'undersample', 'smote_tomek', 'smote_enn', 'class_weights', 'none'
            random_state: Random seed
        """
        self.strategy = strategy
        self.random_state = random_state
        self.class_weights = None
    
    def fit_resample(self, X, y):
        """
        Balance the dataset.
        
        Args:
            X: Features (DataFrame or array)
            y: Labels (Series or array)
            
        Returns:
            X_resampled, y_resampled
        """
        # Convert to numpy for resampling
        is_dataframe = isinstance(X, pd.DataFrame)
        feature_names = X.columns.tolist() if is_dataframe else None
        
        X_arr = X.values if is_dataframe else X
        y_arr = y.values if isinstance(y, pd.Series) else y
        
        # Log class distribution
        unique, counts = np.unique(y_arr, return_counts=True)
        logger.info(f"Original class distribution: {dict(zip(unique, counts))}")
        
        if self.strategy == 'none':
            return X, y
        
        elif self.strategy == 'class_weights':
            # Don't resample, just compute weights
            self.class_weights = self._compute_weights(y_arr)
            logger.info(f"Class weights: {self.class_weights}")
            return X, y
        
        elif self.strategy == 'smote':
            sampler = SMOTE(random_state=self.random_state, k_neighbors=3)
        
        elif self.strategy == 'adasyn':
            sampler = ADASYN(random_state=self.random_state, n_neighbors=3)
        
        elif self.strategy == 'undersample':
            sampler = RandomUnderSampler(random_state=self.random_state)
        
        elif self.strategy == 'smote_tomek':
            sampler = SMOTETomek(random_state=self.random_state, smote=SMOTE(k_neighbors=3))
        
        elif self.strategy == 'smote_enn':
            sampler = SMOTEENN(random_state=self.random_state, smote=SMOTE(k_neighbors=3))
        
        else:
            raise ValueError(f"Unknown strategy: {self.strategy}")
        
        try:
            X_resampled, y_resampled = sampler.fit_resample(X_arr, y_arr)
            
            # Log new distribution
            unique, counts = np.unique(y_resampled, return_counts=True)
            logger.info(f"Resampled class distribution: {dict(zip(unique, counts))}")
            
            # Convert back to DataFrame if needed
            if is_dataframe:
                X_resampled = pd.DataFrame(X_resampled, columns=feature_names)
            if isinstance(y, pd.Series):
                y_resampled = pd.Series(y_resampled, name=y.name)
            
            return X_resampled, y_resampled
        
        except Exception as e:
            logger.warning(f"Resampling failed: {e}. Returning original data.")
            return X, y
    
    def get_class_weights(self, y):
        """Get class weights for model training."""
        if self.class_weights is not None:
            return self.class_weights
        
        y_arr = y.values if isinstance(y, pd.Series) else y
        return self._compute_weights(y_arr)
    
    def _compute_weights(self, y):
        """Compute class weights."""
        classes = np.unique(y)
        weights = compute_class_weight('balanced', classes=classes, y=y)
        return dict(zip(classes, weights))
