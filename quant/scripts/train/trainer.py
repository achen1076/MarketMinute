"""Model instantiation and training logic."""

from src.models.base.lgbm_classifier import LGBMClassifier
from src.models.base.xgb_classifier import XGBClassifier
from src.models.base.lgbm_return_predictor import LGBMReturnPredictor
from src.models.ensemble_classifier import QuantModel

from src.models.lgbm_hyperparameter_tuner import LightGBMHyperparameterTuner
from src.models.xgb_hyperparameter_tuner import XGBHyperparameterTuner
from src.models.regime_aware_tuner import RegimeAwareHyperparameterTuner, RegimeAwareXGBTuner
from src.models.lgbm_return_tuner import LGBMReturnTuner

from .config import FORWARD_PERIODS


def train_model(
    model_type,
    X_train, y_train,
    X_val, y_val,
    use_tuning=False,
    regime_labels_val=None,
    adaptive_threshold=None
):
    if model_type == "lgbm":
        if use_tuning:
            if regime_labels_val is not None:
                tuner = RegimeAwareHyperparameterTuner(
                    n_trials=40, regime_weight=0.6)
                params = tuner.tune(X_train, y_train, X_val,
                                    y_val, regime_labels_val)
            else:
                tuner = LightGBMHyperparameterTuner(n_trials=40)
                params = tuner.tune(X_train, y_train, X_val, y_val)
        else:
            params = None

        model = LGBMClassifier(params=params)
        model.fit(X_train, y_train, X_val, y_val)
        return model

    elif model_type == "xgb":
        if use_tuning:
            if regime_labels_val is not None:
                tuner = RegimeAwareXGBTuner(n_trials=40, regime_weight=0.6)
                params = tuner.tune(X_train, y_train, X_val,
                                    y_val, regime_labels_val)
            else:
                tuner = XGBHyperparameterTuner(n_trials=40)
                params = tuner.tune(X_train, y_train, X_val, y_val)
        else:
            params = None

        model = XGBClassifier(params=params)
        model.fit(X_train, y_train, X_val, y_val)
        return model

    elif model_type == "return":
        if use_tuning:
            tuner = LGBMReturnTuner(
                n_trials=30,
                forward_periods=FORWARD_PERIODS,
                transaction_cost_bps=10.0
            )
            best_params, threshold_scale = tuner.tune(
                X_train, y_train, X_val, y_val)
            model = LGBMReturnPredictor()
            model.params.update(best_params)
            model.threshold_scale = threshold_scale
        else:
            model = LGBMReturnPredictor()
            model.threshold_scale = 0.5  # Default
        model.fit(X_train, y_train, X_val, y_val)
        return model

    elif model_type == "ensemble":
        model = QuantModel(
            use_lgbm=True,
            use_xgboost=True,
            use_lstm=False,
            use_transformer=False,
            use_tuning=False,
            strategy="weighted",
            weight_power=2.0
        )
        model.fit(X_train, y_train, X_val, y_val)
        return model

    else:
        raise ValueError(f"Unknown model type: {model_type}")
