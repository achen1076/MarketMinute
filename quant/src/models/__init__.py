"""
Models module with traditional ML and deep learning models.
"""
from .base.lgbm_classifier import LGBMClassifier
from .hyperparameter_tuner import LGBMHyperparameterTuner

# XGBoost (optional import)
try:
    from .base.xgb_classifier import XGBClassifier
    from .xgb_hyperparameter_tuner import XGBHyperparameterTuner
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    XGBClassifier = None
    XGBHyperparameterTuner = None

# Deep learning models (optional imports)
try:
    from .deep_learning import LSTMClassifier, TransformerClassifier
    DEEP_LEARNING_AVAILABLE = True
except ImportError:
    DEEP_LEARNING_AVAILABLE = False
    LSTMClassifier = None
    TransformerClassifier = None

# Advanced tuner (optional import)
try:
    from .advanced_tuner import AdvancedHyperparameterTuner
    ADVANCED_TUNER_AVAILABLE = True
except ImportError:
    ADVANCED_TUNER_AVAILABLE = False
    AdvancedHyperparameterTuner = None

# Ensemble models
try:
    from .ensemble_classifier import EnsembleClassifier, QuantModel, LGBMDeepLearningEnsemble
    ENSEMBLE_AVAILABLE = True
except ImportError:
    ENSEMBLE_AVAILABLE = False
    EnsembleClassifier = None
    QuantModel = None
    LGBMDeepLearningEnsemble = None

__all__ = [
    'LGBMClassifier',
    'XGBClassifier',
    'LGBMHyperparameterTuner',
    'XGBHyperparameterTuner',
    'LSTMClassifier',
    'TransformerClassifier',
    'AdvancedHyperparameterTuner',
    'EnsembleClassifier',
    'QuantModel',
    'LGBMDeepLearningEnsemble',
]
