"""Validation-based decision threshold calibration.

Classifiers ship with a fixed confidence threshold (0.65) and the return
predictor with a fixed threshold_scale (0.5). The optimal cutoff varies by
ticker: noisy names need a stricter gate, trending names a looser one.

This module sweeps the decision threshold on the validation set (never the
test set) and stores the Sharpe-optimal value on the model object itself, so
it is carried into the pickled artifact and used automatically by SageMaker
inference at predict time.
"""

import numpy as np

from src.evaluation.financial_metrics import FinancialMetrics

from .config import FORWARD_PERIODS

# Sweep grids
CLASSIFIER_THRESHOLDS = [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]
RETURN_THRESHOLD_SCALES = [0.25, 0.50, 0.75, 1.00, 1.25, 1.50]

# Below this many validation trades a Sharpe estimate is noise
MIN_VAL_TRADES = 8


def calibrate_decision_threshold(model, X_val, y_val, fwd_ret_val,
                                 transaction_cost_bps=10):
    """Pick the Sharpe-optimal decision threshold on validation data.

    Mutates the model in place (confidence_threshold or threshold_scale)
    and returns the chosen value, or None if the model exposes no
    calibratable threshold.
    """
    if hasattr(model, "confidence_threshold"):
        return _calibrate_attr(
            model, "confidence_threshold", CLASSIFIER_THRESHOLDS,
            X_val, y_val, fwd_ret_val, transaction_cost_bps)
    if hasattr(model, "threshold_scale") or hasattr(model, "predict_returns"):
        return _calibrate_attr(
            model, "threshold_scale", RETURN_THRESHOLD_SCALES,
            X_val, y_val, fwd_ret_val, transaction_cost_bps)
    return None


def _calibrate_attr(model, attr, grid, X_val, y_val, fwd_ret_val,
                    transaction_cost_bps):
    evaluator = FinancialMetrics(transaction_cost_bps=transaction_cost_bps)
    fwd_ret_val = np.asarray(fwd_ret_val)

    default = getattr(model, attr, None)
    best_value = default
    best_sharpe = -np.inf
    found_valid = False

    for value in grid:
        setattr(model, attr, value)
        try:
            y_pred = model.predict(X_val)
        except Exception:
            continue

        n_trades = int(np.sum(np.asarray(y_pred) != 0))
        if n_trades < MIN_VAL_TRADES:
            continue

        metrics = evaluator.evaluate(
            y_true=y_val, y_pred=y_pred,
            forward_returns=fwd_ret_val, holding_period=FORWARD_PERIODS)

        if metrics.sharpe_ratio > best_sharpe:
            best_sharpe = metrics.sharpe_ratio
            best_value = value
            found_valid = True

    # If no threshold produced enough trades, keep the model default
    setattr(model, attr, best_value if found_valid else default)
    return getattr(model, attr)
