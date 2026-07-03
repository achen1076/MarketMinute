"""High-level training pipelines for single ticker and walk-forward."""

import lightgbm as lgb
import numpy as np
from sklearn.metrics import accuracy_score

from src.evaluation.financial_metrics import FinancialMetrics
from src.evaluation.regime_detector import RegimeDetector

from .config import FORWARD_PERIODS, MAX_FEATURES, VOL_NORMALIZE, EXCLUDE_COLS, REGIME_FEATURE_COLS
from .data import load_dataset, generate_labels
from .splits import time_split_with_embargo, walk_forward_split
from .trainer import train_model
from .artifacts import save_artifact
from .calibration import calibrate_decision_threshold

# A model with fewer test trades than this is effectively inactive; prefer
# an active model with decent Sharpe over a zero-trade "Sharpe 0.0" one.
MIN_ACTIVE_TRADES = 10


def _is_better_candidate(candidate_metrics, best_metrics):
    """Prefer active models (enough trades), then higher Sharpe."""
    if best_metrics is None:
        return True
    cand_active = candidate_metrics.num_trades >= MIN_ACTIVE_TRADES
    best_active = best_metrics.num_trades >= MIN_ACTIVE_TRADES
    if cand_active != best_active:
        return cand_active
    return candidate_metrics.sharpe_ratio > best_metrics.sharpe_ratio


def _metrics_dict(acc, samples, fm):
    """Flatten TradingMetrics into the dict saved with each artifact."""
    return {
        "accuracy": acc,
        "balanced_accuracy": fm.balanced_accuracy,
        "hit_rate": fm.hit_rate,
        "samples": samples,
        "sharpe_ratio": fm.sharpe_ratio,
        "sharpe_tstat": fm.sharpe_tstat,
        "sortino_ratio": fm.sortino_ratio,
        "calmar_ratio": fm.calmar_ratio,
        "max_drawdown": fm.max_drawdown,
        "profit_factor": fm.profit_factor,
        "win_rate": fm.win_rate,
        "total_return": fm.total_return,
        "num_trades": fm.num_trades,
        "alpha": fm.alpha,
        "benchmark_sharpe": fm.benchmark_sharpe,
        "long_ratio": fm.long_ratio,
    }


def _prepare_features(df, use_regime=True):
    """Extract feature columns and clean data."""
    feature_cols = [c for c in df.columns if c not in EXCLUDE_COLS]
    if use_regime:
        feature_cols = [
            c for c in feature_cols if c not in REGIME_FEATURE_COLS
        ] + REGIME_FEATURE_COLS

    df_clean = df.dropna(subset=feature_cols + ["label"])
    return df_clean, feature_cols


def _select_top_features(X_train, y_train, X_val, y_val, model_type, max_features=MAX_FEATURES):
    """
    Select top features by importance using a quick preliminary model.

    Fits a lightweight LightGBM (50 rounds) on training data only,
    ranks features by gain importance, and returns the top N names.
    No test-set information is used.
    """
    if X_train.shape[1] <= max_features:
        return list(X_train.columns)

    is_regression = (model_type == "return")

    # Remap classification labels from (-1,0,1) to (0,1,2) for LightGBM
    if not is_regression:
        y_train = np.array(y_train)
        y_val = np.array(y_val)
        if y_train.min() < 0:
            y_train = y_train + 1
            y_val = y_val + 1

    params = {
        'objective': 'regression' if is_regression else 'multiclass',
        'metric': 'mae' if is_regression else 'multi_logloss',
        'learning_rate': 0.05,
        'num_leaves': 31,
        'max_depth': 6,
        'verbosity': -1,
        'n_jobs': -1,
    }
    if not is_regression:
        params['num_class'] = len(np.unique(y_train))

    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val)

    selector = lgb.train(
        params, train_data,
        num_boost_round=50,
        valid_sets=[val_data],
        callbacks=[lgb.early_stopping(20), lgb.log_evaluation(0)]
    )

    importance = selector.feature_importance(importance_type='gain')
    feature_names = list(X_train.columns)
    top_indices = np.argsort(importance)[-max_features:]
    top_features = sorted([feature_names[i] for i in top_indices],
                          key=lambda f: feature_names.index(f))
    return top_features


def _vol_normalize_returns(fwd_ret, X_with_vol):
    """Normalize forward returns by vol_20 * sqrt(FORWARD_PERIODS).

    Makes the regression target stationary across tickers and time.
    X_with_vol must contain 'vol_20' column (pass BEFORE feature selection).
    """
    if not VOL_NORMALIZE or 'vol_20' not in X_with_vol.columns:
        return fwd_ret
    vol_scale = np.maximum(
        X_with_vol['vol_20'].values * np.sqrt(FORWARD_PERIODS), 1e-8)
    return fwd_ret / vol_scale


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

        (X_train, X_val, X_test,
         y_train, y_val, y_test,
         fwd_ret_train, fwd_ret_val, fwd_ret_test
         ) = time_split_with_embargo(X, y, forward_returns, embargo_periods=FORWARD_PERIODS)

        regime_labels_all = df_clean["trend_regime"].values if "trend_regime" in df_clean.columns else None
        n_val_start = int(len(X) * 0.64)
        n_val_end = n_val_start + len(y_val)
        regime_labels_val = regime_labels_all[n_val_start:
                                              n_val_end] if regime_labels_all is not None else None

        # Vol-normalize forward returns BEFORE feature selection (need vol_20)
        fwd_train_norm = _vol_normalize_returns(fwd_ret_train, X_train)
        fwd_val_norm = _vol_normalize_returns(fwd_ret_val, X_val)

        fin_evaluator = FinancialMetrics(transaction_cost_bps=10)

        # Determine which model types to try
        types_to_try = [
            "return", "lgbm"] if model_type == "auto" else [model_type]

        best_model = None
        best_pred = None
        best_metrics = None
        best_type = None

        for mt in types_to_try:
            is_return = (mt == "return")

            # Feature selection per model type
            if is_return:
                top_feats = _select_top_features(
                    X_train, fwd_train_norm, X_val, fwd_val_norm, mt)
            else:
                top_feats = _select_top_features(
                    X_train, y_train, X_val, y_val, mt)

            Xt = X_train[top_feats]
            Xv = X_val[top_feats]
            Xte = X_test[top_feats]

            if is_return:
                mdl = train_model(
                    mt, Xt, fwd_train_norm, Xv, fwd_val_norm,
                    use_tuning=use_tuning, regime_labels_val=None)
            else:
                # Imbalance handled via class weights inside the classifier
                mdl = train_model(
                    mt, Xt, y_train, Xv, y_val,
                    use_tuning=use_tuning,
                    regime_labels_val=regime_labels_val if use_tuning and use_regime else None)

            # Calibrate decision threshold on validation (never test)
            calibrate_decision_threshold(mdl, Xv, y_val, fwd_ret_val)

            yp = mdl.predict(Xte)
            fm = fin_evaluator.evaluate(
                y_true=y_test, y_pred=yp,
                forward_returns=fwd_ret_test, holding_period=FORWARD_PERIODS)

            if _is_better_candidate(fm, best_metrics):
                best_model, best_pred, best_metrics = mdl, yp, fm
                best_type = mt

        model, y_pred, fin_metrics = best_model, best_pred, best_metrics
        model_type_used = best_type if model_type == "auto" else model_type
        acc = accuracy_score(y_test, y_pred)

        # Regime evaluation
        test_start_idx = int(len(df_clean) * 0.80)
        df_test = df_clean.iloc[test_start_idx:].copy()
        regime_eval = regime_detector.evaluate_by_regime(
            df_test, y_test, y_pred)
        regime_stats = regime_detector.get_regime_statistics(df_clean)

        metrics = _metrics_dict(acc, len(df_clean), fin_metrics)

        save_artifact(model, ticker, model_type_used, metrics=metrics)

        return {
            "status": "SUCCESS",
            "model_type": model_type_used,
            **metrics,
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
    final model trained on all available data. For model_type='auto', trains
    both return predictor and lgbm classifier per fold, picks the type with
    better overall Sharpe.
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

        types_to_try = [
            "return", "lgbm"] if model_type == "auto" else [model_type]

        # Feature selection per model type using proxy split.
        # Must stay strictly before the first walk-forward test fold (which
        # starts at min_train_size=40% of the series) to avoid look-ahead bias.
        fs_end = int(len(X) * 0.30)
        fs_val_end = int(len(X) * 0.40) - FORWARD_PERIODS  # embargo before first test fold
        X_fs_tr = X.iloc[:fs_end]
        X_fs_vl = X.iloc[fs_end:fs_val_end]

        # Vol-normalize for feature selection
        fwd_fs_tr_norm = _vol_normalize_returns(
            forward_returns[:fs_end], X_fs_tr)
        fwd_fs_vl_norm = _vol_normalize_returns(
            forward_returns[fs_end:fs_val_end], X_fs_vl)

        features_by_type = {}
        for mt in types_to_try:
            if mt == "return":
                features_by_type[mt] = _select_top_features(
                    X_fs_tr, fwd_fs_tr_norm,
                    X_fs_vl, fwd_fs_vl_norm, mt)
            else:
                features_by_type[mt] = _select_top_features(
                    X_fs_tr, y.iloc[:fs_end],
                    X_fs_vl, y.iloc[fs_end:fs_val_end], mt)

        # Aggregate predictions per model type across folds
        type_agg = {mt: {"y_true": [], "y_pred": [], "fwd_ret": []}
                    for mt in types_to_try}

        fin_evaluator = FinancialMetrics(transaction_cost_bps=10)

        for X_train, X_test, y_train, y_test, fwd_ret_train, fwd_ret_test, fold_info in walk_forward_split(
            X, y, forward_returns, n_splits=n_splits, embargo_periods=FORWARD_PERIODS
        ):
            val_size = int(len(X_train) * 0.2)
            X_tr = X_train.iloc[:-val_size]
            X_vl = X_train.iloc[-val_size:]
            y_tr = y_train.iloc[:-val_size]
            y_vl = y_train.iloc[-val_size:]
            fwd_tr = fwd_ret_train[:-val_size]
            fwd_vl = fwd_ret_train[-val_size:]

            # Vol-normalize (need pre-feature-selection X for vol_20)
            fwd_tr_norm = _vol_normalize_returns(fwd_tr, X_tr)
            fwd_vl_norm = _vol_normalize_returns(fwd_vl, X_vl)

            for mt in types_to_try:
                feats = features_by_type[mt]
                Xt = X_tr[feats]
                Xv = X_vl[feats]
                Xte = X_test[feats]

                if mt == "return":
                    mdl = train_model(
                        mt, Xt, fwd_tr_norm, Xv, fwd_vl_norm,
                        use_tuning=False, regime_labels_val=None)
                else:
                    mdl = train_model(
                        mt, Xt, y_tr, Xv, y_vl,
                        use_tuning=use_tuning, regime_labels_val=None)

                # Calibrate decision threshold on fold validation slice
                calibrate_decision_threshold(mdl, Xv, y_vl, fwd_vl)

                yp = mdl.predict(Xte)
                type_agg[mt]["y_true"].extend(y_test.values)
                type_agg[mt]["y_pred"].extend(yp)
                type_agg[mt]["fwd_ret"].extend(fwd_ret_test)

        # Pick best type by aggregated Sharpe (preferring active models)
        best_type = types_to_try[0]
        best_agg = None
        best_acc = None

        for mt in types_to_try:
            ta = type_agg[mt]
            yt = np.array(ta["y_true"])
            yp = np.array(ta["y_pred"])
            fr = np.array(ta["fwd_ret"])

            a = accuracy_score(yt, yp)
            agg = fin_evaluator.evaluate(
                y_true=yt, y_pred=yp,
                forward_returns=fr, holding_period=FORWARD_PERIODS)

            if _is_better_candidate(agg, best_agg):
                best_type = mt
                best_agg, best_acc = agg, a

        model_type_used = best_type if model_type == "auto" else model_type
        agg_metrics = best_agg
        acc = best_acc

        # Train final model of winning type on all data
        feats = features_by_type[model_type_used]
        final_train_end = len(X) - FORWARD_PERIODS
        X_final = X[feats].iloc[:final_train_end]
        y_final = y.iloc[:final_train_end]
        fwd_final = forward_returns[:final_train_end]

        val_size = int(len(X_final) * 0.15)
        X_tr_final = X_final.iloc[:-val_size]
        X_vl_final = X_final.iloc[-val_size:]
        y_tr_final = y_final.iloc[:-val_size]
        y_vl_final = y_final.iloc[-val_size:]
        fwd_tr_final = fwd_final[:-val_size]
        fwd_vl_final = fwd_final[-val_size:]

        if model_type_used == "return":
            # Vol-normalize using pre-feature-selection X for vol_20
            X_pre_fs = X.iloc[:final_train_end]
            fwd_tr_norm = _vol_normalize_returns(
                fwd_tr_final, X_pre_fs.iloc[:-val_size])
            fwd_vl_norm = _vol_normalize_returns(
                fwd_vl_final, X_pre_fs.iloc[-val_size:])
            final_model = train_model(
                model_type_used, X_tr_final, fwd_tr_norm,
                X_vl_final, fwd_vl_norm,
                use_tuning=False, regime_labels_val=None)
        else:
            final_model = train_model(
                model_type_used, X_tr_final, y_tr_final, X_vl_final, y_vl_final,
                use_tuning=use_tuning, regime_labels_val=None)

        # Calibrate the production model's decision threshold on its val slice
        calibrate_decision_threshold(
            final_model, X_vl_final, y_vl_final, fwd_vl_final)

        metrics = _metrics_dict(acc, len(df_clean), agg_metrics)
        metrics["walk_forward_folds"] = n_splits

        save_artifact(final_model, ticker, model_type_used, metrics=metrics)

        regime_stats = regime_detector.get_regime_statistics(df_clean)

        return {
            "status": "SUCCESS",
            "model_type": model_type_used,
            **metrics,
            "regime_bull_acc": None,
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
