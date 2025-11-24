import json
import numpy as np
import os
import joblib
from pathlib import Path

MODEL_DIR = "/opt/ml/model"


def model_fn(model_dir):
    """Load all LGBM models for different stocks"""
    models = {}
    model_path = Path(MODEL_DIR)

    # Load all .pkl files
    for model_file in model_path.glob("*_lgbm.pkl"):
        ticker = model_file.stem.replace("_lgbm", "")
        try:
            models[ticker] = joblib.load(model_file)
            print(f"Loaded model for {ticker}")
        except Exception as e:
            print(f"Failed to load model for {ticker}: {e}")

    if not models:
        print("WARNING: No models found!")
    else:
        print(f"Successfully loaded {len(models)} models")

    return models


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


def predict_fn(input_data, models):
    """Generate predictions for requested tickers with probabilities"""
    predictions = {}

    # Single ticker prediction
    if "ticker" in input_data:
        ticker = input_data["ticker"]
        features = np.array(input_data["features"])

        if ticker in models:
            # Return both class prediction and probabilities
            pred_class = models[ticker].predict(features).tolist()
            pred_proba = models[ticker].predict_proba(features).tolist()
            predictions[ticker] = {
                "class": pred_class,
                "probabilities": pred_proba
            }
        else:
            predictions[ticker] = {"error": f"No model available for {ticker}"}

    # Multiple tickers prediction
    elif "tickers" in input_data:
        for ticker in input_data["tickers"]:
            if ticker in models and ticker in input_data.get("features", {}):
                features = np.array(input_data["features"][ticker])
                # Return both class prediction and probabilities
                pred_class = models[ticker].predict(features).tolist()
                pred_proba = models[ticker].predict_proba(features).tolist()
                predictions[ticker] = {
                    "class": pred_class,
                    "probabilities": pred_proba
                }
            else:
                predictions[ticker] = {
                    "error": f"No model or features for {ticker}"}

    # Default: predict for all available models
    else:
        features = np.array(input_data.get("features", []))
        if len(features) > 0:
            for ticker, model in models.items():
                try:
                    pred_class = model.predict(features).tolist()
                    pred_proba = model.predict_proba(features).tolist()
                    predictions[ticker] = {
                        "class": pred_class,
                        "probabilities": pred_proba
                    }
                except Exception as e:
                    predictions[ticker] = {"error": str(e)}

    return predictions


def output_fn(prediction, response_content_type):
    return json.dumps({
        "predictions": prediction,
        "model_count": len(prediction) if isinstance(prediction, dict) else 0
    })
