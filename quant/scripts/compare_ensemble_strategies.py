"""
Compare different ensemble strategies to find the best combination.
Tests multiple model combinations and strategies on a subset of tickers.
"""
import pandas as pd
import yaml
from pathlib import Path
from sklearn.model_selection import train_test_split
import numpy as np

from src.models.ensemble_classifier import QuantModel
from src.data.features.feature_engine import FeatureEngine
from src.data.labels.binary_labeler import BinaryLabeler

# Test configurations
CONFIGS = [
    # Single models
    {
        'name': 'LightGBM Only',
        'use_lgbm': True,
        'use_xgboost': False,
        'use_lstm': False,
        'strategy': 'weighted',
        'use_tuning': False,
    },
    # {
    #     'name': 'XGBoost Only',
    #     'use_lgbm': False,
    #     'use_xgboost': True,
    #     'use_lstm': False,
    #     'strategy': 'weighted',
    #     'use_tuning': True,
    # },
    # Two-model ensembles
    # {
    #     'name': 'LGBM + XGBoost (Weighted power=1.0)',
    #     'use_lgbm': True,
    #     'use_xgboost': True,
    #     'use_lstm': False,
    #     'strategy': 'weighted',
    #     'use_tuning': True,
    #     'weight_power': 1.0  # Linear (original)
    # },
    # {
    #     'name': 'LGBM + XGBoost (Weighted power=2.0)',
    #     'use_lgbm': True,
    #     'use_xgboost': True,
    #     'use_lstm': False,
    #     'strategy': 'weighted',
    #     'use_tuning': True,
    #     'weight_power': 2.0  # Quadratic
    # },
    # Three-model ensemble(if you have time)
    # {
    #     'name': 'LGBM + XGBoost + LSTM',
    #     'use_lgbm': True,
    #     'use_xgboost': True,
    #     'use_lstm': True,
    #     'strategy': 'weighted'
    # },
]

# Test on a subset of tickers
TEST_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA']


def test_config(config, ticker, X_train, y_train, X_val, y_val, X_test, y_test):
    """Test a single configuration."""
    try:
        model = QuantModel(
            use_lstm=config['use_lstm'],
            use_transformer=False,
            use_tuning=config['use_tuning'],
            use_lgbm=config['use_lgbm'],
            use_xgboost=config['use_xgboost'],
            strategy=config['strategy'],
            # Default to 2.0 if not specified
            weight_power=config.get('weight_power', 2.0)
        )

        model.fit(X_train, y_train, X_val, y_val)
        results = model.evaluate(X_test, y_test)

        return {
            'config': config['name'],
            'ticker': ticker,
            'accuracy': results['ensemble']['accuracy'],
            'precision': results['ensemble']['precision'],
            'recall': results['ensemble']['recall'],
            'f1': results['ensemble']['f1'],
            'weights': model.ensemble.weights if hasattr(model.ensemble, 'weights') else None,
            'individual_accuracies': [m['accuracy'] for m in results['individual_models']]
        }
    except Exception as e:
        print(f"  ❌ Error with {config['name']}: {str(e)[:50]}")
        return None


def main():
    print("=" * 80)
    print(" ENSEMBLE STRATEGY COMPARISON")
    print("=" * 80)

    # Load configuration
    with open("SYSTEM_SPEC.yaml", 'r') as f:
        system_config = yaml.safe_load(f)

    all_results = []

    for ticker in TEST_TICKERS:
        print(f"\n{'='*80}")
        print(f"Testing {ticker}...")
        print(f"{'='*80}")

        # Load and prepare data
        data_file = Path(f"data/processed/{ticker.lower()}_processed.csv")
        if not data_file.exists():
            print(f"  ⚠️  No data for {ticker}")
            continue

        df = pd.read_csv(data_file)
        df['timestamp'] = pd.to_datetime(df['timestamp'])

        if len(df) < 100:
            print(f"  ⚠️  Insufficient data")
            continue

        # Generate features
        feature_engine = FeatureEngine()
        df = feature_engine.calculate_all(df)

        # Generate labels
        labeler = BinaryLabeler(
            forward_periods=10,
            threshold_pct=0.02,
            mode='strong_moves'
        )
        df = labeler.fit_transform(df)

        # Prepare features
        exclude_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume',
                        'ticker', 'label', 'forward_ret', 'return_at_label']
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        df_clean = df.dropna(subset=feature_cols + ['label'])

        if len(df_clean) < 500:
            print(f"  ⚠️  Insufficient samples ({len(df_clean)})")
            continue

        X = df_clean[feature_cols]
        y = df_clean['label']

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=0.25, shuffle=False
        )

        print(
            f"  Samples: {len(df_clean)} | Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")

        # Test each configuration
        for config in CONFIGS:
            print(f"\n  Testing: {config['name']}...", end=" ", flush=True)
            result = test_config(config, ticker, X_train,
                                 y_train, X_val, y_val, X_test, y_test)
            if result:
                all_results.append(result)
                print(f"✓ Acc: {result['accuracy']*100:.1f}%", end="")
                if result['weights']:
                    weights_str = ", ".join(
                        [f"{w*100:.1f}%" for w in result['weights']])
                    print(f" | Weights: [{weights_str}]")
                else:
                    print()

    # Aggregate results
    if not all_results:
        print("\n\n❌ No results to analyze")
        return

    results_df = pd.DataFrame(all_results)

    print("\n\n" + "=" * 80)
    print(" RESULTS SUMMARY")
    print("=" * 80)

    # Average by configuration
    summary = results_df.groupby('config').agg({
        'accuracy': ['mean', 'std'],
        'precision': ['mean', 'std'],
        'recall': ['mean', 'std'],
        'f1': ['mean', 'std']
    }).round(4)

    print("\n📊 Average Performance by Configuration:\n")
    print(summary)

    # Best configuration
    best_config = results_df.groupby('config')['accuracy'].mean().idxmax()
    best_acc = results_df.groupby('config')['accuracy'].mean().max()

    print(f"\n🏆 WINNER: {best_config}")
    print(f"   Average Accuracy: {best_acc*100:.2f}%")

    # Detailed breakdown
    print(f"\n\n📈 Detailed Results by Ticker:\n")
    pivot = results_df.pivot(
        index='ticker', columns='config', values='accuracy')
    print((pivot * 100).round(1))

    # Save results
    output_path = Path("outputs/ensemble_comparison.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    results_df.to_csv(output_path, index=False)
    print(f"\n\n💾 Detailed results saved to: {output_path}")

    # Weight analysis for weighted strategies
    print(f"\n\n⚖️  Weight Analysis (Weighted Strategy):\n")
    weighted_results = [r for r in all_results if r['weights']
                        is not None and 'Weighted' in r['config']]
    if weighted_results:
        for result in weighted_results:
            if len(result['weights']) > 1:
                print(f"  {result['ticker']} ({result['config']}):")
                print(
                    f"    Weights: {[f'{w*100:.1f}%' for w in result['weights']]}")
                print(
                    f"    Individual accuracies: {[f'{a*100:.1f}%' for a in result['individual_accuracies']]}")


if __name__ == "__main__":
    main()
