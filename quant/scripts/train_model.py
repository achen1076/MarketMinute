"""
Train Ensemble model (LightGBM + LSTM) for all tickers and save to outputs/
Reads tickers from SYSTEM_SPEC.yaml
Usage: python scripts/train_model.py
"""
import pandas as pd
import yaml
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

from src.models.ensemble_classifier import QuantModel
from src.data.features.feature_engine import FeatureEngine
from src.data.features.curated_features import CuratedFeatureEngine
from src.data.labels.binary_labeler import BinaryLabeler
from src.data.preprocessing.class_balancer import ClassBalancer


print("="*70)
print(" TRAINING MODELS")
print("="*70)

# Load tickers from SYSTEM_SPEC.yaml
with open("SYSTEM_SPEC.yaml", 'r') as f:
    config = yaml.safe_load(f)

tickers = config['objectives']['universe']['tickers']

# Train model for each ticker
results_summary = []

for idx, ticker in enumerate(tickers, 1):
    print(f"\n[{idx}/{len(tickers)}] {ticker}...", end=" ", flush=True)

    # Load data
    data_file = Path(f"data/processed/{ticker.lower()}_processed.csv")
    if not data_file.exists():
        print(f"❌ No data")
        continue

    df = pd.read_csv(data_file)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Check minimum data requirement before feature calculation
    if len(df) < 100:
        print(f"❌ Insufficient raw data ({len(df)} bars, need 100+)")
        continue

    # Generate base features
    feature_engine = FeatureEngine()
    df = feature_engine.calculate_all(df)

    # Generate labels using binary classification (strong moves only)
    labeler = BinaryLabeler(
        forward_periods=10,
        threshold_pct=0.02,  # 2% minimum move
        mode='strong_moves'
    )
    df = labeler.fit_transform(df)

    # Log label distribution
    label_dist = df['label'].value_counts().to_dict()

    # Get feature columns (exclude OHLCV and label columns)
    exclude_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume',
                    'ticker', 'label', 'forward_ret', 'return_at_label']
    feature_cols = [col for col in df.columns if col not in exclude_cols]

    # Prepare data
    df_clean = df.dropna(subset=feature_cols + ['label'])

    if len(df_clean) < 500:
        print(f"❌ Insufficient data ({len(df_clean)} samples)")
        continue

    # Print label stats for first ticker only
    if idx == 1:
        print(f"\n{'='*70}")
        print(f"LABEL ANALYSIS for {ticker}:")
        print(f"  Label distribution: {label_dist}")
        print(f"  Samples: {len(df_clean)}")
        print(f"{'='*70}\n")

    X = df_clean[feature_cols]
    y = df_clean['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.25, shuffle=False
    )

    # Train ensemble
    try:
        ensemble = QuantModel(
            use_lstm=False,
            use_transformer=False,
            use_tuning=False,
            use_lgbm=True,
            use_xgboost=False,
            strategy='weighted'
        )
        ensemble.fit(X_train, y_train, X_val, y_val)
        results = ensemble.evaluate(X_test, y_test)
        ensemble_acc = results['ensemble']['accuracy']

        output_path = f"outputs/models/{ticker.lower()}_ensemble"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        ensemble.save(output_path)

        print(f"✓ {ensemble_acc*100:.1f}% | {len(df_clean)} samples")

        results_summary.append({
            'ticker': ticker,
            'accuracy': ensemble_acc,
            'samples': len(df_clean),
            'status': 'SUCCESS'
        })

    except Exception as e:
        print(f"❌ Error: {str(e)[:50]}")
        results_summary.append({
            'ticker': ticker,
            'accuracy': 0.0,
            'samples': len(df_clean),
            'status': 'ERROR'
        })

print(f"\n{'='*70}")
successful = [r for r in results_summary if r['status'] == 'SUCCESS']
if successful:
    avg_acc = sum(r['accuracy'] for r in successful) / len(successful)
    print(
        f" COMPLETE: {len(successful)}/{len(tickers)} models | Avg: {avg_acc*100:.1f}%")
print(f"{'='*70}")
