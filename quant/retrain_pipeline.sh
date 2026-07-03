#!/bin/bash
# =============================================================================
# Full Model Retraining Pipeline (wrapper)
# =============================================================================
# Thin wrapper around the two consolidated entry points:
#   ./train.sh   — data prep + model training
#   ./deploy.sh  — SageMaker image + metadata S3 upload + endpoint update
#
# Usage:
#   ./retrain_pipeline.sh                       # full pipeline (train + deploy)
#   ./retrain_pipeline.sh --skip-prep           # skip data prep
#   ./retrain_pipeline.sh --skip-train          # deploy only
#   ./retrain_pipeline.sh --skip-deploy         # train only (skip image build)
#   ./retrain_pipeline.sh --skip-upload         # skip metadata upload
#   ./retrain_pipeline.sh --tune                # enable hyperparameter tuning
#   ./retrain_pipeline.sh --no-walk-forward     # single split (faster)
#   ./retrain_pipeline.sh --model lgbm          # force model type (default: auto)
#   ./retrain_pipeline.sh --tickers AAPL,MSFT   # train a subset
#   ./retrain_pipeline.sh --skip-terraform      # don't update SageMaker endpoint
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

SKIP_TRAIN=false
SKIP_DEPLOY=false
TRAIN_ARGS=()
DEPLOY_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-train) SKIP_TRAIN=true; shift ;;
        --skip-deploy) SKIP_DEPLOY=true; DEPLOY_ARGS+=("--skip-image"); shift ;;
        --skip-prep|--tune|--no-tune|--no-walk-forward) TRAIN_ARGS+=("$1"); shift ;;
        --model|--wf-splits|--tickers) TRAIN_ARGS+=("$1" "$2"); shift 2 ;;
        --skip-upload|--skip-terraform) DEPLOY_ARGS+=("$1"); shift ;;
        --apply-terraform) shift ;;  # default behavior, kept for compat
        -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [ "$SKIP_TRAIN" = false ]; then
    "$SCRIPT_DIR/train.sh" "${TRAIN_ARGS[@]+"${TRAIN_ARGS[@]}"}"
fi

"$SCRIPT_DIR/deploy.sh" "${DEPLOY_ARGS[@]+"${DEPLOY_ARGS[@]}"}"
