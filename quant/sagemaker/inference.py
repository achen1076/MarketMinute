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


def predict_fn(input_data, model_path):
    """Generate predictions for requested tickers with probabilities (lazy-loaded)"""
    predictions = {}

    # Single ticker prediction
    if "ticker" in input_data:
        ticker = input_data["ticker"]
        features = np.array(input_data["features"])

        model = load_model(ticker)
        if model:
            # Return both class prediction and probabilities
            pred_class = model.predict(features).tolist()
            pred_proba = model.predict_proba(features).tolist()
            predictions[ticker] = {
                "class": pred_class,
                "probabilities": pred_proba
            }
        else:
            predictions[ticker] = {"error": f"No model available for {ticker}"}

    # Multiple tickers prediction (batch)
    elif "tickers" in input_data:
        for ticker in input_data["tickers"]:
            if ticker in input_data.get("features", {}):
                model = load_model(ticker)
                if model:
                    features = np.array(input_data["features"][ticker])
                    # Return both class prediction and probabilities
                    pred_class = model.predict(features).tolist()
                    pred_proba = model.predict_proba(features).tolist()
                    predictions[ticker] = {
                        "class": pred_class,
                        "probabilities": pred_proba
                    }
                else:
                    predictions[ticker] = {
                        "error": f"No model available for {ticker}"}
            else:
                predictions[ticker] = {"error": f"No features for {ticker}"}

    # Not supported: predicting for all models (would load 223 models!)
    else:
        return {"error": "Must specify 'ticker' or 'tickers' in request"}

    return predictions


def output_fn(prediction, response_content_type):
    return json.dumps({
        "predictions": prediction,
        "model_count": len(prediction) if isinstance(prediction, dict) else 0
    })
