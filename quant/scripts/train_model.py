"""
Batch training pipeline for all tickers in SYSTEM_SPEC.yaml

Unified training pipeline for:
    - LightGBM
    - XGBoost
    - Ensemble (LGBM + XGB + optional LSTM/Transformer)
Supports both:
    • Binary classification  (-1, +1)
    • Multiclass classification (-1, 0, +1)

Applies:
    • Hybrid balancing (Mode A: soft oversampling)
    • Model-specific hyperparameter tuning (optional)
    • Deterministic time-series splits with purging (no leakage)
    • Dynamic vol-scaled label thresholds for 10-day horizon
    • Label subsampling to reduce serial correlation
    • Clean artifact saving: model, scaler, metadata

Usage:
    python3 scripts/train_model.py --model lgbm --labels multiclass
    python3 scripts/train_model.py --model ensemble --tune
    python3 scripts/train_model.py --model return --walk-forward

Pipeline modules live in scripts/train/:
    config.py    - Constants (FORWARD_PERIODS, exclude cols)
    data.py      - Dataset loading, feature gen, label gen
    splits.py    - Time splits with embargo + purging
    balance.py   - Hybrid class balancing
    trainer.py   - Model instantiation and training
    artifacts.py - Model saving and metadata
    pipeline.py  - Single-ticker and walk-forward pipelines
"""

import argparse
from pathlib import Path

import pandas as pd

from train.config import FORWARD_PERIODS
from train.data import load_tickers
from train.pipeline import train_single_ticker, train_walk_forward


def main():
    parser = argparse.ArgumentParser(
        description="Train models for all tickers in SYSTEM_SPEC.yaml"
    )
    parser.add_argument("--model", type=str, default="return",
                        choices=["lgbm", "xgb", "ensemble", "return"],
                        help="Model type to train (return = regression-based predictor, recommended)")
    parser.add_argument("--labels", type=str, default="multiclass",
                        choices=["binary", "multiclass"],
                        help="Label type")
    parser.add_argument("--tune", action="store_true",
                        help="Run hyperparameter tuning")
    parser.add_argument("--no-regime", action="store_true",
                        help="Disable regime features in training")
    parser.add_argument("--walk-forward", action="store_true",
                        help="Use walk-forward validation (more robust, slower)")
    parser.add_argument("--wf-splits", type=int, default=5,
                        help="Number of walk-forward splits (default: 5)")

    args = parser.parse_args()
    use_regime = not args.no_regime

    tickers = load_tickers()
    total = len(tickers)

    print(f"\n{'='*70}")
    print(f" BATCH TRAINING: {total} tickers")
    wf_str = f"WalkFwd({args.wf_splits})" if args.walk_forward else "SingleSplit"
    print(
        f" Model: {args.model} | Labels: {args.labels} | Tuning: {args.tune} | Regime: {use_regime}")
    print(f" Validation: {wf_str} | Embargo: {FORWARD_PERIODS} periods")
    print(f"{'='*70}\n")

    results = []

    for idx, ticker in enumerate(tickers, 1):
        print(f"\n[{idx}/{total}] {ticker}...", end=" ", flush=True)

        if args.walk_forward:
            result = train_walk_forward(
                ticker,
                args.model,
                args.labels,
                args.tune,
                use_regime,
                n_splits=args.wf_splits
            )
        else:
            result = train_single_ticker(
                ticker,
                args.model,
                args.labels,
                args.tune,
                use_regime
            )

        result["ticker"] = ticker
        results.append(result)

        if result["status"] == "SUCCESS":
            sharpe = result.get('sharpe_ratio', 0)
            pf = result.get('profit_factor', 0)
            alpha = result.get('alpha', 0)
            lr = result.get('long_ratio', 0)
            pf_str = f"{pf:.2f}" if pf != float('inf') else "∞"
            print(
                f"✓ Acc:{result['accuracy']*100:.1f}% | Sharpe:{sharpe:.2f} | PF:{pf_str} | α:{alpha:.2f} | L/S:{lr*100:.0f}% | {result['samples']} samples")
        elif result["status"] == "SKIP":
            print(f"⊘ {result['reason']}")
        else:
            print(f"✗ {result['reason']}")

    print(f"\n{'='*70}")
    successful = [r for r in results if r['status'] == 'SUCCESS']
    skipped = [r for r in results if r['status'] == 'SKIP']
    failed = [r for r in results if r['status'] == 'ERROR']

    print(f" SUMMARY:")
    print(f"   ✓ Success: {len(successful)}/{total}")
    print(f"   ⊘ Skipped: {len(skipped)}/{total}")
    print(f"   ✗ Failed:  {len(failed)}/{total}")

    if successful:
        avg_acc = sum(r['accuracy'] for r in successful) / len(successful)
        avg_sharpe = sum(r.get('sharpe_ratio', 0)
                         for r in successful) / len(successful)
        avg_max_dd = sum(r.get('max_drawdown', 0)
                         for r in successful) / len(successful)
        avg_win_rate = sum(r.get('win_rate', 0)
                           for r in successful) / len(successful)

        valid_pf = [r.get('profit_factor', 0) for r in successful if r.get(
            'profit_factor', 0) != float('inf')]
        avg_pf = sum(valid_pf) / len(valid_pf) if valid_pf else 0

        print(f"\n   📊 CLASSIFICATION METRICS:")
        print(f"      Avg Accuracy: {avg_acc*100:.1f}%")

        avg_alpha = sum(r.get('alpha', 0)
                        for r in successful) / len(successful)
        avg_long_ratio = sum(r.get('long_ratio', 0)
                             for r in successful) / len(successful)

        print(f"\n   💰 FINANCIAL METRICS:")
        print(f"      Avg Sharpe Ratio: {avg_sharpe:.2f}")
        print(f"      Avg Max Drawdown: {avg_max_dd*100:.1f}%")
        print(f"      Avg Profit Factor: {avg_pf:.2f}")
        print(f"      Avg Win Rate: {avg_win_rate*100:.1f}%")
        print(f"      Avg Alpha (vs B&H): {avg_alpha:.2f}")
        print(f"      Avg Long Ratio: {avg_long_ratio*100:.0f}%")

        bull_accs = [r.get('regime_bull_acc')
                     for r in successful if r.get('regime_bull_acc') is not None]
        bear_accs = [r.get('regime_bear_acc')
                     for r in successful if r.get('regime_bear_acc') is not None]
        sideways_accs = [r.get('regime_sideways_acc') for r in successful if r.get(
            'regime_sideways_acc') is not None]

        if bull_accs or bear_accs or sideways_accs:
            print(f"\n   📈 REGIME PERFORMANCE:")
            if bull_accs:
                print(
                    f"      Bull Market Accuracy: {sum(bull_accs)/len(bull_accs)*100:.1f}%")
            if bear_accs:
                print(
                    f"      Bear Market Accuracy: {sum(bear_accs)/len(bear_accs)*100:.1f}%")
            if sideways_accs:
                print(
                    f"      Sideways Accuracy: {sum(sideways_accs)/len(sideways_accs)*100:.1f}%")

    print(f"\n{'='*70}\n")

    summary_df = pd.DataFrame(results)
    project_root = Path(__file__).resolve().parents[1]
    summary_path = project_root / "models" / args.model / "training_summary.csv"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_df.to_csv(summary_path, index=False)
    print(f"📊 Summary saved to {summary_path}\n")


if __name__ == "__main__":
    main()
