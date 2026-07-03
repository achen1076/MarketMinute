import json
import numpy as np
import os
import joblib
from pathlib import Path

MODEL_DIR = "/opt/ml/model"

# Global model cache for lazy loading
_model_cache = {}
# Best model type per ticker from metadata
_best_model_type = {}


def _load_best_model_map():
    """Read model_metadata.json to determine best model type per ticker."""
    global _best_model_type
    metadata_path = Path(MODEL_DIR) / "model_metadata.json"
    if not metadata_path.exists():
        print("No model_metadata.json found, will fall back to file discovery")
        return

    try:
        with open(metadata_path, 'r') as f:
            data = json.load(f)

        models = data.get("models", {})
        # Group by ticker, pick model with highest Sharpe
        ticker_models = {}
        for key, meta in models.items():
            ticker = meta.get("ticker", "")
            sharpe = meta.get("sharpe_ratio", -999)
            model_type = meta.get("model_type", "")
            if ticker not in ticker_models or sharpe > ticker_models[ticker][0]:
                ticker_models[ticker] = (sharpe, model_type)

        _best_model_type = {t: info[1] for t, info in ticker_models.items()}
        print(
            f"Loaded best-model map for {len(_best_model_type)} tickers from metadata")
    except Exception as e:
        print(f"Failed to load model metadata: {e}")


def model_fn(model_dir):
    """
    Returns model directory path for lazy loading.
    Models are loaded on-demand in predict_fn to save memory.
    """
    model_path = Path(MODEL_DIR)

    # Load best-model map from metadata
    _load_best_model_map()

    # Support both return and lgbm models
    available_return = [f.stem.replace("_return", "")
                        for f in model_path.glob("*_return.pkl")]
    available_lgbm = [f.stem.replace("_lgbm", "")
                      for f in model_path.glob("*_lgbm.pkl")]

    total = len(available_return) + len(available_lgbm)
    print(f"Model directory ready with {total} model files available")
    print(f"  - Return models: {len(available_return)}")
    print(f"  - LGBM models: {len(available_lgbm)}")
    print(f"Memory optimization: Models will be lazy-loaded on demand")

    return model_path


def load_model(ticker):
    """Lazy-load the best model for a ticker based on metadata Sharpe."""
    if ticker in _model_cache:
        return _model_cache[ticker]

    # Use metadata to pick the best model type for this ticker
    best_type = _best_model_type.get(ticker)

    if best_type:
        model_path = Path(MODEL_DIR) / f"{ticker}_{best_type}.pkl"
        if model_path.exists():
            try:
                model = joblib.load(model_path)
                _model_cache[ticker] = model
                print(
                    f"Lazy-loaded best model for {ticker} (type={best_type})")
                return model
            except Exception as e:
                print(f"Failed to load best model for {ticker}: {e}")

    # Fallback: try both types, prefer return then lgbm
    for mtype in ["return", "lgbm"]:
        model_path = Path(MODEL_DIR) / f"{ticker}_{mtype}.pkl"
        if model_path.exists():
            try:
                model = joblib.load(model_path)
                _model_cache[ticker] = model
                print(
                    f"Lazy-loaded fallback model for {ticker} (type={mtype})")
                return model
            except Exception as e:
                print(f"Failed to load {mtype} model for {ticker}: {e}")

    return None


def input_fn(request_body, request_content_type):
    """
    Expected input format:
    {
        "ticker": "AAPL",  # Single ticker
        "features": [[...]]  # Feature array
    }
    OR
    {
        "tickers": ["AAPL", "MSFT"],  # Multiple tickers
        "features": {"AAPL": [[...]], "MSFT": [[...]]}  # Features per ticker
    }
    """
    if request_content_type == "application/json":
        data = json.loads(request_body)
        return data
    else:
        raise ValueError(
            "Unsupported content type: {}".format(request_content_type))


def _build_feature_array(model, raw_features):
    """
    Build a 2D numpy array of features in the order the model was trained on.

    Accepts two input formats:
      1. Dict format (preferred):    {feature_name: value, ...}
                                     {feature_name: [value], ...}
                                     [{feature_name: value, ...}]   (single row)
      2. Positional format (legacy): [[v1, v2, ...]]
         Only works if the array width matches len(model.feature_names).

    Returns np.ndarray of shape (1, n_features).
    Raises ValueError on missing features or shape mismatch.
    """
    expected = getattr(model, "feature_names", None)

    # Normalize: if list of dicts, take first row; if dict-of-lists, take index 0
    if isinstance(raw_features, list) and len(raw_features) > 0 and isinstance(raw_features[0], dict):
        raw_features = raw_features[0]

    if isinstance(raw_features, dict):
        if not expected:
            raise ValueError(
                "Model has no feature_names; cannot map dict-format features.")
        row = []
        missing = []
        for name in expected:
            if name not in raw_features:
                missing.append(name)
                continue
            val = raw_features[name]
            # Handle scalar or single-element list
            if isinstance(val, list):
                val = val[0] if val else float("nan")
            row.append(float(val))
        if missing:
            raise ValueError(
                f"Missing features for model: {missing[:5]}{'...' if len(missing) > 5 else ''} "
                f"(model expects {len(expected)}, request had {len(raw_features)})")
        return np.array([row])

    # Legacy positional path
    arr = np.array(raw_features)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    if expected and arr.shape[1] != len(expected):
        raise ValueError(
            f"Positional feature count mismatch: model expects {len(expected)}, "
            f"got {arr.shape[1]}. Send features as a dict keyed by feature_name.")
    return arr


def predict_fn(input_data, model_path):
    """Generate predictions for requested tickers with probabilities (lazy-loaded)"""
    predictions = {}

    # Single ticker prediction
    if "ticker" in input_data:
        ticker = input_data["ticker"]
        model = load_model(ticker)
        if not model:
            predictions[ticker] = {"error": f"No model available for {ticker}"}
            return predictions
        try:
            features = _build_feature_array(model, input_data["features"])
            pred_class = model.predict(features).tolist()
            pred_proba = model.predict_proba(features).tolist()
            predictions[ticker] = {
                "class": pred_class,
                "probabilities": pred_proba
            }
        except Exception as e:
            predictions[ticker] = {"error": f"{type(e).__name__}: {str(e)}"}

    # Multiple tickers prediction (batch)
    elif "tickers" in input_data:
        feats_in = input_data.get("features", {})
        for ticker in input_data["tickers"]:
            if ticker not in feats_in:
                predictions[ticker] = {"error": f"No features for {ticker}"}
                continue
            model = load_model(ticker)
            if not model:
                predictions[ticker] = {
                    "error": f"No model available for {ticker}"}
                continue
            try:
                features = _build_feature_array(model, feats_in[ticker])
                pred_class = model.predict(features).tolist()
                pred_proba = model.predict_proba(features).tolist()
                predictions[ticker] = {
                    "class": pred_class,
                    "probabilities": pred_proba
                }
            except Exception as e:
                predictions[ticker] = {
                    "error": f"{type(e).__name__}: {str(e)}"}

    # Not supported: predicting for all models (would load 223 models!)
    else:
        return {"error": "Must specify 'ticker' or 'tickers' in request"}

    return predictions


def output_fn(prediction, response_content_type):
    return json.dumps({
        "predictions": prediction,
        "model_count": len(prediction) if isinstance(prediction, dict) else 0
    })
