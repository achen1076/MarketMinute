"""Generate predictions using trained models.

Updated to work with new optimized model structure:
- models/lgbm/{ticker}_lgbm.pkl
- models/xgb/{ticker}_xgb.pkl  
- models/ensemble/{ticker}_ensemble.pkl

Usage: python3 scripts/generate_predictions.py [--model lgbm|xgb|ensemble]
"""
import pandas as pd
import numpy as np
import pickle
import yaml
from pathlib import Path
from datetime import datetime
import argparse

from src.data.features.feature_engine import FeatureEngine


def generate_predictions(model_type="lgbm"):
    """Generate predictions for latest data."""
    print("="*70)
    print(f" GENERATING LIVE PREDICTIONS ({model_type.upper()})")
    print("="*70)
    print()

    predictions = []

    # Load tickers from SYSTEM_SPEC.yaml
    spec_file = Path("SYSTEM_SPEC.yaml")
    if not spec_file.exists():
        print("ERROR: SYSTEM_SPEC.yaml not found")
        return

    with open(spec_file, 'r') as f:
        config = yaml.safe_load(f)

    tickers = config['objectives']['universe']['tickers']
    print(f"Processing {len(tickers)} tickers from SYSTEM_SPEC.yaml\n")

    models_path = Path(f"models/{model_type}")
    if not models_path.exists():
        print(
            f"ERROR: No {model_type} models directory found. Run: python3 scripts/train_model.py --model {model_type}")
        return

    # Process tickers from SYSTEM_SPEC that have trained models
    processed = 0
    skipped = 0

    for ticker in tickers:
        ticker = ticker.upper()
        model_path = models_path / f"{ticker.lower()}_{model_type}.pkl"

        if not model_path.exists():
            skipped += 1
            continue

        print(f"Processing {ticker}...")

        # Check if data file exists
        data_file = Path(f"data/processed/{ticker.lower()}_processed.csv")
        if not data_file.exists():
            print(f"  No data file found, skipping")
            skipped += 1
            continue

        # Load model (should be the model object directly with scaler/feature_names as attributes)
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
            scaler = getattr(model, 'scaler', None)
            feature_names = getattr(model, 'feature_names', [])

        # Load and prepare data
        df = pd.read_csv(data_file)
        # Engineer features
        engine = FeatureEngine()
        df_features = engine.calculate_all(df)

        labeling_artifacts = ['rolling_vol', 'neutral_thresh', 'strong_thresh', 'dyn_thresh']
        
        if feature_names:
            feature_cols = [f for f in feature_names if f not in labeling_artifacts]
            print(f"  Using {len(feature_cols)} features from saved model")
        else:
            exclude_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume',
                            'ticker', 'label', 'forward_ret', 'return_at_label'] + labeling_artifacts
            feature_cols = [
                col for col in df_features.columns if col not in exclude_cols and not col.startswith('Unnamed')]
            print(f"  Using {len(feature_cols)} features (auto-detected)")

        missing_features = [f for f in feature_cols if f not in df_features.columns]
        if missing_features:
            print(f"  ERROR: Missing features: {missing_features[:5]}...")
            continue

        latest_data = df_features[feature_cols].dropna().tail(5)
        if len(latest_data) == 0:
            print(f"  No valid data for {ticker}")
            continue

        if scaler is not None:
            latest_data_scaled = pd.DataFrame(
                scaler.transform(latest_data),
                columns=feature_cols,
                index=latest_data.index
            )
        else:
            latest_data_scaled = latest_data

        probas = model.predict_proba(latest_data_scaled)
        if len(probas.shape) == 1:
            probas = probas.reshape(1, -1)

        pred_classes = np.argmax(probas, axis=1)
        label_map_reverse = {0: -1, 1: 0, 2: 1}
        preds = np.array([label_map_reverse[int(p)] for p in pred_classes])
        
        latest_pred = preds[-1]
        latest_proba = probas[-1]
        signal_map = {-1: "SELL", 0: "NEUTRAL", 1: "BUY"}
        signal = signal_map[latest_pred]
        confidence = latest_proba.max()
        
        prob_down = latest_proba[0]
        prob_neutral = latest_proba[1]
        prob_up = latest_proba[2]
        
        latest_price = df['close'].iloc[-1]
        latest_time = df['timestamp'].iloc[-1]
        if 'atr_14' in df_features.columns:
            latest_atr = df_features['atr_14'].dropna().iloc[-1]
            if latest_pred == 1:
                tp_target = latest_price + (1.5 * latest_atr)
                sl_target = latest_price - (1.0 * latest_atr)
            elif latest_pred == -1:
                tp_target = latest_price - (1.5 * latest_atr)
                sl_target = latest_price + (1.0 * latest_atr)
            else:
                tp_target = None
                sl_target = None
        else:
            latest_atr = None
            tp_target = None
            sl_target = None

        min_confidence = 0.64
        should_trade = confidence >= min_confidence and latest_pred != 0

        predictions.append({
            'ticker': ticker,
            'timestamp': latest_time,
            'current_price': latest_price,
            'signal': signal,
            'confidence': confidence,
            'prob_up': prob_up,
            'prob_neutral': prob_neutral,
            'prob_down': prob_down,
            'should_trade': should_trade,
            'take_profit': tp_target,
            'stop_loss': sl_target,
            'atr': latest_atr
        })

        print(f"  Signal: {signal} (Confidence: {confidence:.1%})")
        print(f"  Should Trade: {'YES' if should_trade else 'NO'}")
        processed += 1

    print(f"\n{'='*70}")
    print(f" SUMMARY: {processed} predictions generated, {skipped} tickers skipped")
    print(f"{'='*70}\n")
    if predictions:
        df_pred = pd.DataFrame(predictions)
        output_path = Path("outputs/live_predictions.csv")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        df_pred.to_csv(output_path, index=False)

        print()
        print("="*70)
        print(" PREDICTIONS SAVED")
        print("="*70)
        print(f"File: {output_path}")
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        print("Open dashboard to view predictions:")
        print("  streamlit run dashboard.py")
        print()
    else:
        print()
        print("No predictions generated. Check that models exist.")


def predict_single_ticker(ticker, model_path=None, show_details=True):
    """
    Make predictions for a single ticker with detailed output.

    Args:
        ticker: Ticker symbol
        model_path: Path to model (default: outputs/ensemble_model or outputs/models/{ticker}_institutional.pkl)
        show_details: Show detailed prediction breakdown
    """
    print(f"\n{'='*70}")
    print(f" Making Predictions: {ticker}")
    print(f"{'='*70}")

    # Load data
    data_file = Path(f"data/processed/{ticker.lower()}_processed.csv")
    if not data_file.exists():
        print(f"❌ No data found for {ticker}")
        print(f"   Run: python scripts/prep_data_for_institutional.py")
        return None

    df = pd.read_csv(data_file)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    print(f"✓ Loaded {len(df)} bars")

    # Generate features
    print("✓ Generating features...")
    engine = FeatureEngine()
    df_features = engine.calculate_all(df)

    # Get feature columns (exclude OHLCV and label columns)
    exclude_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume',
                    'ticker', 'label', 'barrier_touched', 'bars_held', 'return_at_barrier']
    feature_cols = [
        col for col in df_features.columns if col not in exclude_cols]

    # Load model
    if model_path is None:
        # Try new model structure first
        lgbm_path = Path(f"models/lgbm/{ticker.lower()}_lgbm.pkl")
        xgb_path = Path(f"models/xgb/{ticker.lower()}_xgb.pkl")
        ensemble_path = Path(f"models/ensemble/{ticker.lower()}_ensemble.pkl")

        # Legacy paths
        old_ensemble_path = Path(
            f"outputs/models/{ticker.lower()}_ensemble_lgbm.pkl")
        old_model_path = Path(
            f"outputs/models/{ticker.lower()}_institutional.pkl")

        if lgbm_path.exists():
            model_path = lgbm_path
            print(f"✓ Using LightGBM model: {model_path}")
        elif xgb_path.exists():
            model_path = xgb_path
            print(f"✓ Using XGBoost model: {model_path}")
        elif ensemble_path.exists():
            model_path = ensemble_path
            print(f"✓ Using Ensemble model: {model_path}")
        elif old_ensemble_path.exists():
            model_path = old_ensemble_path
            print(f"✓ Using old ensemble model: {model_path}")
        elif old_model_path.exists():
            model_path = old_model_path
            print(f"✓ Using old model: {model_path}")
        else:
            print(f"❌ No model found for {ticker}")
            print(f"   Run: python3 scripts/train_model.py --model lgbm")
            return None

    # Load model
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
        scaler = getattr(model, 'scaler', None)
        feature_names = getattr(model, 'feature_names', feature_cols)

    # Prepare data
    X = df_features[feature_names].dropna()
    print(f"✓ Ready to predict on {len(X)} samples")

    # Make predictions
    print("\n📊 Making predictions...")
    predictions = model.predict(X)
    probabilities = model.predict_proba(X)

    # Show summary
    unique, counts = np.unique(predictions, return_counts=True)
    label_names = {-1: 'DOWN', 0: 'NEUTRAL', 1: 'UP'}

    print(f"\nPrediction Summary:")
    for label, count in zip(unique, counts):
        pct = count/len(predictions)*100
        print(f"  {label_names[label]:8s}: {count:4d} ({pct:5.1f}%)")

    if show_details:
        print(f"\n📋 Last 10 Predictions:")
        print(
            f"{'Index':<8} {'Price':<10} {'Prediction':<12} {'Confidence':<12} {'Probabilities'}")
        print("-" * 70)

        for i in range(max(0, len(predictions)-10), len(predictions)):
            pred = predictions[i]
            proba = probabilities[i]
            price = df['close'].iloc[i]
            conf = proba.max()
            pred_name = label_names[pred]

            prob_str = f"[{proba[0]:.2f}, {proba[1]:.2f}, {proba[2]:.2f}]"
            print(f"{i:<8} ${price:<9.2f} {pred_name:<12} {conf:<12.1%} {prob_str}")

    return {
        'predictions': predictions,
        'probabilities': probabilities,
        'data': df,
        'features': df_features
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Generate predictions with trained models')
    parser.add_argument(
        '--ticker', type=str, help='Generate predictions for specific ticker (e.g., SPY)')
    parser.add_argument(
        '--model', type=str, default='lgbm', choices=['lgbm', 'xgb', 'ensemble'],
        help='Model type to use for predictions')

    args = parser.parse_args()

    if args.ticker:
        # Predict on specific ticker with details
        predict_single_ticker(args.ticker, show_details=True)
    else:
        # Generate live predictions for all tickers
        print("PROGRESS:10:Starting prediction generation...", flush=True)
        generate_predictions(model_type=args.model)
        print("PROGRESS:100:Complete!", flush=True)
