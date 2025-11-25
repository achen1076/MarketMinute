import json
import numpy as np
import os
import joblib
from pathlib import Path

MODEL_DIR = "/opt/ml/model"

# Global model cache for lazy loading
_model_cache = {}


def model_fn(model_dir):
    """
    Returns model directory path for lazy loading.
    Models are loaded on-demand in predict_fn to save memory.
    """
    model_path = Path(MODEL_DIR)
    available_models = [f.stem.replace("_lgbm", "")
                        for f in model_path.glob("*_lgbm.pkl")]

    print(
        f"Model directory ready with {len(available_models)} models available")
    print(f"Memory optimization: Models will be lazy-loaded on demand")

    return model_path


def load_model(ticker):
    """Lazy-load a model only when needed"""
    if ticker in _model_cache:
        return _model_cache[ticker]

    model_path = Path(MODEL_DIR) / f"{ticker}_lgbm.pkl"
    if not model_path.exists():
        return None

    try:
        model = joblib.load(model_path)
        _model_cache[ticker] = model  # Cache for reuse
        print(f"Lazy-loaded model for {ticker}")
        return model
    except Exception as e:
        print(f"Failed to load model for {ticker}: {e}")
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
