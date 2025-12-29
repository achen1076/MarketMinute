"""
Regime-Aware Hyperparameter Tuner
---------------------------------------------------------------------
Optimizes hyperparameters for balanced performance across all market regimes.

Instead of maximizing overall accuracy/F1, this tuner uses a composite score
that penalizes poor performance in any regime (bull, bear, sideways).

This prevents models that only work well in bull markets (which dominate
historical data) and ensures robust performance across market conditions.

Usage:
    tuner = RegimeAwareHyperparameterTuner(n_trials=40)
    params = tuner.tune(X_train, y_train, X_val, y_val, regime_labels_val)
"""

import optuna
import numpy as np
import pandas as pd
from sklearn.metrics import f1_score, accuracy_score
from collections import Counter
import lightgbm as lgb
import logging
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


def hybrid_balance(X, y, multiplier=1.4):
    df = X.copy()
    df["label"] = y

    counts = df["label"].value_counts().to_dict()
    max_count = max(counts.values())

    combined = []
    for cls, cnt in counts.items():
        subset = df[df["label"] == cls]

        if cnt < max_count:
            repeat_factor = max(1, int((max_count / cnt - 1) * multiplier))
            oversampled = pd.concat([subset] * repeat_factor, axis=0)
            combined.append(oversampled)

        combined.append(subset)

    df_bal = pd.concat(combined, axis=0).sample(frac=1, random_state=42)
    return df_bal.drop(columns=["label"]), df_bal["label"].values


def compute_class_weights(y):
    counts = Counter(y)
    total = sum(counts.values())
    n_class = len(counts)
    return {cls: total / (n_class * cnt) for cls, cnt in counts.items()}


class RegimeAwareHyperparameterTuner:

    def __init__(
        self,
        n_trials: int = 40,
        use_gpu: bool = False,
        regime_weight: float = 0.6,
        min_regime_samples: int = 50
    ):
        self.n_trials = n_trials
        self.use_gpu = use_gpu
        self.regime_weight = regime_weight
        self.min_regime_samples = min_regime_samples
        self.study = None
        self.regime_performance_history = []

    def _compute_regime_score(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        regime_labels: np.ndarray
    ) -> Tuple[float, Dict[str, float]]:
        overall_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
        regime_accuracies = {}
        unique_regimes = np.unique(regime_labels)

        for regime in unique_regimes:
            mask = regime_labels == regime
            if mask.sum() >= self.min_regime_samples:
                regime_acc = accuracy_score(y_true[mask], y_pred[mask])
                regime_accuracies[str(regime)] = regime_acc

        if not regime_accuracies:
            return overall_f1, {}

        min_regime_acc = min(regime_accuracies.values())
        regime_values = list(regime_accuracies.values())
        if all(v > 0 for v in regime_values):
            harmonic_mean = len(regime_values) / \
                sum(1/v for v in regime_values)
        else:
            harmonic_mean = 0

        composite = (
            (1 - self.regime_weight) * overall_f1 +
            self.regime_weight * 0.5 * (min_regime_acc + harmonic_mean)
        )

        return composite, regime_accuracies

    def objective(
        self,
        trial: optuna.Trial,
        X_train: pd.DataFrame,
        y_train: np.ndarray,
        X_val: pd.DataFrame,
        y_val: np.ndarray,
        regime_labels_val: np.ndarray
    ) -> float:
        Xb, yb = hybrid_balance(X_train, y_train)

        label_map = {-1: 0, 0: 1, 1: 2}
        yb_mapped = np.array([label_map.get(int(l), int(l)) for l in yb])
        y_val_mapped = np.array([label_map.get(int(l), int(l)) for l in y_val])
        class_weights = compute_class_weights(yb)

        weight_array = np.array([class_weights[c] for c in yb])

        penalty = trial.suggest_float("class_penalty", 0.8, 4.0)
        weight_array = weight_array * penalty

        params = {
            "objective": "multiclass",
            "num_class": 3,
            "metric": "multi_logloss",
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.15),
            "num_leaves": trial.suggest_int("num_leaves", 16, 128),
            "max_depth": trial.suggest_int("max_depth", 3, 9),
            "min_data_in_leaf": trial.suggest_int("min_data_in_leaf", 50, 600),
            "feature_fraction": trial.suggest_float("feature_fraction", 0.6, 1.0),
            "bagging_fraction": trial.suggest_float("bagging_fraction", 0.6, 1.0),
            "bagging_freq": trial.suggest_int("bagging_freq", 1, 8),
            "lambda_l1": trial.suggest_float("lambda_l1", 0.0, 5.0),
            "lambda_l2": trial.suggest_float("lambda_l2", 0.0, 5.0),
            "min_gain_to_split": trial.suggest_float("min_gain_to_split", 0.0, 3.0),
            "verbosity": -1,
            "force_col_wise": True,
            "deterministic": True,
            "num_threads": -1,
        }

        if self.use_gpu:
            params["device_type"] = "gpu"
        else:
            params["device_type"] = "cpu"

        train_data = lgb.Dataset(Xb, label=yb_mapped, weight=weight_array)
        val_data = lgb.Dataset(X_val, label=y_val_mapped, reference=train_data)

        model = lgb.train(
            params,
            train_data,
            valid_sets=[train_data, val_data],
            num_boost_round=800,
            callbacks=[lgb.early_stopping(50, verbose=False)],
        )

        preds = model.predict(X_val)
        y_pred_mapped = np.argmax(preds, axis=1)
        reverse_label_map = {0: -1, 1: 0, 2: 1}
        y_pred = np.array([reverse_label_map.get(int(l), int(l))
                          for l in y_pred_mapped])

        composite_score, regime_accs = self._compute_regime_score(
            y_val, y_pred, regime_labels_val
        )

        self.regime_performance_history.append({
            'trial': trial.number,
            'composite_score': composite_score,
            'regime_accuracies': regime_accs,
            'overall_f1': f1_score(y_val, y_pred, average="macro", zero_division=0)
        })

        return composite_score

    def tune(
        self,
        X_train: pd.DataFrame,
        y_train: np.ndarray,
        X_val: pd.DataFrame,
        y_val: np.ndarray,
        regime_labels_val: np.ndarray
    ) -> Dict:

        self.regime_performance_history = []

        def _objective(trial):
            return self.objective(
                trial, X_train, y_train, X_val, y_val, regime_labels_val
            )

        # Suppress Optuna logging
        optuna.logging.set_verbosity(optuna.logging.WARNING)

        self.study = optuna.create_study(direction="maximize")
        self.study.optimize(
            _objective,
            n_trials=self.n_trials,
            show_progress_bar=True
        )

        # Log results
        best_trial = self.study.best_trial
        best_history = next(
            (h for h in self.regime_performance_history if h['trial'] == best_trial.number),
            None
        )

        logger.info(f"[Regime Tuner] Best Trial: {best_trial.number}")
        logger.info(
            f"[Regime Tuner] Best Composite Score: {self.study.best_value:.4f}")

        if best_history:
            logger.info(
                f"[Regime Tuner] Overall F1: {best_history['overall_f1']:.4f}")
            logger.info(
                f"[Regime Tuner] Regime Accuracies: {best_history['regime_accuracies']}")

        logger.info(f"[Regime Tuner] Best Params: {best_trial.params}")

        return best_trial.params

    def get_regime_analysis(self) -> pd.DataFrame:
        """
        Get detailed regime performance analysis from tuning history.

        Returns:
            DataFrame with per-trial regime performance
        """
        if not self.regime_performance_history:
            return pd.DataFrame()

        records = []
        for h in self.regime_performance_history:
            record = {
                'trial': h['trial'],
                'composite_score': h['composite_score'],
                'overall_f1': h['overall_f1']
            }
            for regime, acc in h['regime_accuracies'].items():
                record[f'regime_{regime}_acc'] = acc
            records.append(record)

        return pd.DataFrame(records)


class RegimeAwareXGBTuner:
    """
    XGBoost version of regime-aware tuner (same logic, different backend).
    """

    def __init__(
        self,
        n_trials: int = 40,
        use_gpu: bool = False,
        regime_weight: float = 0.6,
        min_regime_samples: int = 50
    ):
        self.n_trials = n_trials
        self.use_gpu = use_gpu
        self.regime_weight = regime_weight
        self.min_regime_samples = min_regime_samples
        self.study = None
        self.regime_performance_history = []

    def _compute_regime_score(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        regime_labels: np.ndarray
    ) -> Tuple[float, Dict[str, float]]:
        """Compute composite score based on regime performance."""
        overall_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)

        regime_accuracies = {}
        unique_regimes = np.unique(regime_labels)

        for regime in unique_regimes:
            mask = regime_labels == regime
            if mask.sum() >= self.min_regime_samples:
                regime_acc = accuracy_score(y_true[mask], y_pred[mask])
                regime_accuracies[str(regime)] = regime_acc

        if not regime_accuracies:
            return overall_f1, {}

        min_regime_acc = min(regime_accuracies.values())
        regime_values = list(regime_accuracies.values())

        if all(v > 0 for v in regime_values):
            harmonic_mean = len(regime_values) / \
                sum(1/v for v in regime_values)
        else:
            harmonic_mean = 0

        composite = (
            (1 - self.regime_weight) * overall_f1 +
            self.regime_weight * 0.5 * (min_regime_acc + harmonic_mean)
        )

        return composite, regime_accuracies

    def objective(
        self,
        trial: optuna.Trial,
        X_train: pd.DataFrame,
        y_train: np.ndarray,
        X_val: pd.DataFrame,
        y_val: np.ndarray,
        regime_labels_val: np.ndarray
    ) -> float:
        """Optuna objective function with regime-aware scoring for XGBoost."""
        import xgboost as xgb

        Xb, yb = hybrid_balance(X_train, y_train)
        class_weights = compute_class_weights(yb)
        weight_array = np.array([class_weights[c] for c in yb])

        penalty = trial.suggest_float("class_penalty", 0.8, 4.0)
        weight_array = weight_array * penalty

        params = {
            "objective": "multi:softprob",
            "num_class": 3,
            "eval_metric": "mlogloss",
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.15),
            "max_depth": trial.suggest_int("max_depth", 3, 9),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "reg_alpha": trial.suggest_float("reg_alpha", 0.0, 5.0),
            "reg_lambda": trial.suggest_float("reg_lambda", 0.0, 5.0),
            "verbosity": 0,
        }

        if self.use_gpu:
            params["tree_method"] = "gpu_hist"

        dtrain = xgb.DMatrix(Xb, label=yb, weight=weight_array)
        dval = xgb.DMatrix(X_val, label=y_val)

        model = xgb.train(
            params,
            dtrain,
            num_boost_round=800,
            evals=[(dtrain, "train"), (dval, "val")],
            early_stopping_rounds=50,
            verbose_eval=False,
        )

        preds = model.predict(dval)
        y_pred = np.argmax(preds, axis=1)

        composite_score, regime_accs = self._compute_regime_score(
            y_val, y_pred, regime_labels_val
        )

        self.regime_performance_history.append({
            'trial': trial.number,
            'composite_score': composite_score,
            'regime_accuracies': regime_accs,
            'overall_f1': f1_score(y_val, y_pred, average="macro", zero_division=0)
        })

        return composite_score

    def tune(
        self,
        X_train: pd.DataFrame,
        y_train: np.ndarray,
        X_val: pd.DataFrame,
        y_val: np.ndarray,
        regime_labels_val: np.ndarray
    ) -> Dict:
        """Run regime-aware hyperparameter tuning for XGBoost."""
        self.regime_performance_history = []

        def _objective(trial):
            return self.objective(
                trial, X_train, y_train, X_val, y_val, regime_labels_val
            )

        optuna.logging.set_verbosity(optuna.logging.WARNING)

        self.study = optuna.create_study(direction="maximize")
        self.study.optimize(
            _objective,
            n_trials=self.n_trials,
            show_progress_bar=True
        )

        best_trial = self.study.best_trial
        logger.info(f"[Regime XGB Tuner] Best Trial: {best_trial.number}")
        logger.info(
            f"[Regime XGB Tuner] Best Composite Score: {self.study.best_value:.4f}")

        return best_trial.params
