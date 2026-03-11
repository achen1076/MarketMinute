"""High-level training pipelines for single ticker and walk-forward."""

import numpy as np
from sklearn.metrics import accuracy_score

from src.evaluation.financial_metrics import FinancialMetrics
from src.evaluation.regime_detector import RegimeDetector

from .config import FORWARD_PERIODS, EXCLUDE_COLS, REGIME_FEATURE_COLS
from .data import load_dataset, generate_labels
from .splits import time_split_with_embargo, walk_forward_split
from .balance import hybrid_balance
from .trainer import train_model
from .artifacts import save_artifact


def _prepare_features(df, use_regime=True):
    """Extract feature columns and clean data."""
    feature_cols = [c for c in df.columns if c not in EXCLUDE_COLS]
    if use_regime:
        feature_cols = [
            c for c in feature_cols if c not in REGIME_FEATURE_COLS
        ] + REGIME_FEATURE_COLS

    df_clean = df.dropna(subset=feature_cols + ["label"])
    return df_clean, feature_cols


def train_single_ticker(ticker, model_type, label_mode, use_tuning, use_regime=True):
    try:
        df = load_dataset(ticker)

        regime_detector = RegimeDetector()
        df = regime_detector.detect_regimes(df)

        df = generate_labels(df, mode=label_mode)

        df_clean, feature_cols = _prepare_features(df, use_regime)

        if len(df_clean) < 500:
            return {"status": "SKIP", "reason": f"Insufficient data ({len(df_clean)} samples)"}

        X = df_clean[feature_cols]
        y = df_clean["label"]
        forward_returns = df_clean["forward_ret"].values if "forward_ret" in df_clean.columns else np.zeros(
            len(y))

        # Use proper time split with embargo to prevent label leakage
        (
            X_train, X_val, X_test,
            y_train, y_val, y_test,
            fwd_ret_train, fwd_ret_val, fwd_ret_test
        ) = time_split_with_embargo(X, y, forward_returns, embargo_periods=FORWARD_PERIODS)

        regime_labels_all = df_clean["trend_regime"].values if "trend_regime" in df_clean.columns else None
        n_val_start = int(len(X) * 0.64)  # Match split point
        n_val_end = n_val_start + len(y_val)
        regime_labels_val = regime_labels_all[n_val_start:
                                              n_val_end] if regime_labels_all is not None else None

        if model_type == "return":
            # Calculate adaptive threshold based on ticker's actual volatility
            ticker_vol = np.std(fwd_ret_train[~np.isnan(fwd_ret_train)])
            adaptive_threshold = ticker_vol * 0.3  # 30% of forward return volatility

            model = train_model(
                model_type, X_train, fwd_ret_train, X_val, fwd_ret_val,
                use_tuning=use_tuning, regime_labels_val=None,
                adaptive_threshold=adaptive_threshold
            )
        else:
            Xb, yb = hybrid_balance(X_train, y_train)
            model = train_model(
                model_type, Xb, yb, X_val, y_val,
                use_tuning=use_tuning,
                regime_labels_val=regime_labels_val if use_tuning and use_regime else None
            )

        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)

        fin_evaluator = FinancialMetrics(transaction_cost_bps=10)
        fin_metrics = fin_evaluator.evaluate(
            y_true=y_test,
            y_pred=y_pred,
            forward_returns=fwd_ret_test,
            holding_period=FORWARD_PERIODS
        )

        # Get test set indices for regime evaluation
        test_start_idx = int(len(df_clean) * 0.80)  # Match split point
        df_test = df_clean.iloc[test_start_idx:].copy()
        regime_eval = regime_detector.evaluate_by_regime(
            df_test, y_test, y_pred)

        regime_stats = regime_detector.get_regime_statistics(df_clean)

        metrics = {
            "accuracy": acc,
            "samples": len(df_clean),
            "sharpe_ratio": fin_metrics.sharpe_ratio,
            "max_drawdown": fin_metrics.max_drawdown,
            "profit_factor": fin_metrics.profit_factor,
            "win_rate": fin_metrics.win_rate,
            "total_return": fin_metrics.total_return,
            "num_trades": fin_metrics.num_trades,
            "alpha": fin_metrics.alpha,
            "benchmark_sharpe": fin_metrics.benchmark_sharpe,
            "long_ratio": fin_metrics.long_ratio
        }

        save_artifact(model, ticker, model_type, metrics=metrics)

        return {
            "status": "SUCCESS",
            "accuracy": acc,
            "samples": len(df_clean),
            "sharpe_ratio": fin_metrics.sharpe_ratio,
            "max_drawdown": fin_metrics.max_drawdown,
            "profit_factor": fin_metrics.profit_factor,
            "win_rate": fin_metrics.win_rate,
            "total_return": fin_metrics.total_return,
            "num_trades": fin_metrics.num_trades,
            "alpha": fin_metrics.alpha,
            "benchmark_sharpe": fin_metrics.benchmark_sharpe,
            "long_ratio": fin_metrics.long_ratio,
            "regime_bull_acc": regime_eval.get("trend_bull_accuracy", None),
            "regime_bear_acc": regime_eval.get("trend_bear_accuracy", None),
            "regime_sideways_acc": regime_eval.get("trend_sideways_accuracy", None),
            "regime_high_vol_acc": regime_eval.get("vol_high_accuracy", None),
            "dominant_trend": max(regime_stats.get("trend_distribution", {}),
                                  key=regime_stats.get("trend_distribution", {}).get, default="unknown")
        }

    except FileNotFoundError:
        return {"status": "SKIP", "reason": "No data file"}
    except Exception as e:
        return {"status": "ERROR", "reason": str(e)[:100]}


def train_walk_forward(ticker, model_type, label_mode, use_tuning, use_regime=True, n_splits=5):
    """
    Train using walk-forward validation for more robust performance estimates.

    Trains multiple models across time, aggregates metrics, and saves the
    final model trained on all available data.
    """
    try:
        df = load_dataset(ticker)

        regime_detector = RegimeDetector()
        df = regime_detector.detect_regimes(df)

        df = generate_labels(df, mode=label_mode)

        df_clean, feature_cols = _prepare_features(df, use_regime)

        if len(df_clean) < 500:
            return {"status": "SKIP", "reason": f"Insufficient data ({len(df_clean)} samples)"}

        X = df_clean[feature_cols]
        y = df_clean["label"]
        forward_returns = df_clean["forward_ret"].values if "forward_ret" in df_clean.columns else np.zeros(
            len(y))

        # Collect metrics across all folds
        fold_metrics = []
        all_y_true = []
        all_y_pred = []
        all_fwd_ret = []

        fin_evaluator = FinancialMetrics(transaction_cost_bps=10)

        for X_train, X_test, y_train, y_test, fwd_ret_train, fwd_ret_test, fold_info in walk_forward_split(
            X, y, forward_returns, n_splits=n_splits, embargo_periods=FORWARD_PERIODS
        ):
            # Split train into train/val for early stopping (80/20)
            val_size = int(len(X_train) * 0.2)
            X_tr = X_train.iloc[:-val_size]
            X_vl = X_train.iloc[-val_size:]
            y_tr = y_train.iloc[:-val_size]
            y_vl = y_train.iloc[-val_size:]
            fwd_tr = fwd_ret_train[:-val_size]
            fwd_vl = fwd_ret_train[-val_size:]

            if model_type == "return":
                model = train_model(
                    model_type, X_tr, fwd_tr, X_vl, fwd_vl,
                    use_tuning=False, regime_labels_val=None
                )
            else:
                Xb, yb = hybrid_balance(X_tr, y_tr)
                model = train_model(
                    model_type, Xb, yb, X_vl, y_vl,
                    use_tuning=use_tuning, regime_labels_val=None
                )

            y_pred = model.predict(X_test)

            # Collect for aggregate metrics
            all_y_true.extend(y_test.values)
            all_y_pred.extend(y_pred)
            all_fwd_ret.extend(fwd_ret_test)

            # Per-fold metrics
            fold_result = fin_evaluator.evaluate(
                y_true=y_test, y_pred=y_pred,
                forward_returns=fwd_ret_test, holding_period=FORWARD_PERIODS
            )
            fold_metrics.append({
                "fold": fold_info["fold"],
                "sharpe": fold_result.sharpe_ratio,
                "pf": fold_result.profit_factor,
                "win_rate": fold_result.win_rate,
                "trades": fold_result.num_trades
            })

        # Aggregate metrics across all folds
        all_y_true = np.array(all_y_true)
        all_y_pred = np.array(all_y_pred)
        all_fwd_ret = np.array(all_fwd_ret)

        acc = accuracy_score(all_y_true, all_y_pred)
        agg_metrics = fin_evaluator.evaluate(
            y_true=all_y_true, y_pred=all_y_pred,
            forward_returns=all_fwd_ret, holding_period=FORWARD_PERIODS
        )

        # Train final model on all data (with embargo from end)
        final_train_end = len(X) - FORWARD_PERIODS
        X_final = X.iloc[:final_train_end]
        y_final = y.iloc[:final_train_end]
        fwd_final = forward_returns[:final_train_end]

        val_size = int(len(X_final) * 0.15)
        X_tr_final = X_final.iloc[:-val_size]
        X_vl_final = X_final.iloc[-val_size:]
        y_tr_final = y_final.iloc[:-val_size]
        y_vl_final = y_final.iloc[-val_size:]
        fwd_tr_final = fwd_final[:-val_size]
        fwd_vl_final = fwd_final[-val_size:]

        if model_type == "return":
            final_model = train_model(
                model_type, X_tr_final, fwd_tr_final, X_vl_final, fwd_vl_final,
                use_tuning=False, regime_labels_val=None
            )
        else:
            Xb, yb = hybrid_balance(X_tr_final, y_tr_final)
            final_model = train_model(
                model_type, Xb, yb, X_vl_final, y_vl_final,
                use_tuning=use_tuning, regime_labels_val=None
            )

        metrics = {
            "accuracy": acc,
            "samples": len(df_clean),
            "sharpe_ratio": agg_metrics.sharpe_ratio,
            "max_drawdown": agg_metrics.max_drawdown,
            "profit_factor": agg_metrics.profit_factor,
            "win_rate": agg_metrics.win_rate,
            "total_return": agg_metrics.total_return,
            "num_trades": agg_metrics.num_trades,
            "alpha": agg_metrics.alpha,
            "benchmark_sharpe": agg_metrics.benchmark_sharpe,
            "long_ratio": agg_metrics.long_ratio,
            "walk_forward_folds": n_splits
        }

        save_artifact(final_model, ticker, model_type, metrics=metrics)

        # Get regime stats
        regime_stats = regime_detector.get_regime_statistics(df_clean)

        return {
            "status": "SUCCESS",
            "accuracy": acc,
            "samples": len(df_clean),
            "sharpe_ratio": agg_metrics.sharpe_ratio,
            "max_drawdown": agg_metrics.max_drawdown,
            "profit_factor": agg_metrics.profit_factor,
            "win_rate": agg_metrics.win_rate,
            "total_return": agg_metrics.total_return,
            "num_trades": agg_metrics.num_trades,
            "alpha": agg_metrics.alpha,
            "benchmark_sharpe": agg_metrics.benchmark_sharpe,
            "long_ratio": agg_metrics.long_ratio,
            "wf_folds": n_splits,
            "regime_bull_acc": None,  # Not computed for walk-forward
            "regime_bear_acc": None,
            "regime_sideways_acc": None,
            "regime_high_vol_acc": None,
            "dominant_trend": max(regime_stats.get("trend_distribution", {}),
                                  key=regime_stats.get("trend_distribution", {}).get, default="unknown")
        }

    except FileNotFoundError:
        return {"status": "SKIP", "reason": "No data file"}
    except Exception as e:
        return {"status": "ERROR", "reason": str(e)[:100]}
