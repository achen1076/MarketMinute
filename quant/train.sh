#!/bin/bash
# =============================================================================
# Model Training — single entry point
# =============================================================================
# Runs data prep + model training. Produces:
#   models/{type}/{TICKER}_{type}.pkl   — trained model artifacts
#   models/model_metadata.json          — per-model metrics & deploy gates
#
# Usage:
#   ./train.sh                          # prep + train all tickers (auto model, walk-forward)
#   ./train.sh --skip-prep              # train only (reuse existing processed CSVs)
#   ./train.sh --tickers AAPL,MSFT      # train a subset (fast iteration)
#   ./train.sh --tune                   # enable hyperparameter tuning (slow)
#   ./train.sh --no-walk-forward        # single time split (faster, less robust)
#   ./train.sh --model lgbm             # force model type (default: auto)
#   ./train.sh --wf-splits 5            # walk-forward fold count
#
# After training, deploy with:  ./deploy.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

SKIP_PREP=false
MODEL_TYPE="auto"
TUNE=false
WALK_FORWARD=true
WF_SPLITS=5
TICKERS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-prep) SKIP_PREP=true; shift ;;
        --tune) TUNE=true; shift ;;
        --no-tune) TUNE=false; shift ;;
        --no-walk-forward) WALK_FORWARD=false; shift ;;
        --model) MODEL_TYPE="$2"; shift 2 ;;
        --wf-splits) WF_SPLITS="$2"; shift 2 ;;
        --tickers) TICKERS="$2"; shift 2 ;;
        -h|--help) sed -n '2,19p' "$0"; exit 0 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

START_TIME=$(date +%s)
LOG_DIR="$SCRIPT_DIR/logs/train"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BOLD}${CYAN}"
echo "=========================================================================="
echo " MARKETMINUTE TRAINING PIPELINE"
echo "=========================================================================="
echo -e "${NC}"
echo "Started:       $(date)"
echo "Model type:    $MODEL_TYPE | Tune: $TUNE | Walk-forward: $WALK_FORWARD (splits=$WF_SPLITS)"
[ -n "$TICKERS" ] && echo "Tickers:       $TICKERS"
echo ""

command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌ python3 not found${NC}"; exit 1; }

# --- Step 1: Data prep ---
if [ "$SKIP_PREP" = false ]; then
    echo -e "${BOLD}${BLUE}── STEP 1: Data prep (FMP fetch + feature engineering) ──${NC}"
    LOG_FILE="$LOG_DIR/prep_${TIMESTAMP}.log"
    python3 scripts/prep_data.py 2>&1 | tee "$LOG_FILE"
    [ "${PIPESTATUS[0]}" -ne 0 ] && { echo -e "${RED}❌ Data prep failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ Data prep complete${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping data prep${NC}"
fi

# --- Step 2: Training ---
echo ""
echo -e "${BOLD}${BLUE}── STEP 2: Train models ──${NC}"
LOG_FILE="$LOG_DIR/train_${TIMESTAMP}.log"

TRAIN_ARGS="--model $MODEL_TYPE"
[ "$TUNE" = true ] && TRAIN_ARGS="$TRAIN_ARGS --tune"
[ "$WALK_FORWARD" = true ] && TRAIN_ARGS="$TRAIN_ARGS --walk-forward --wf-splits $WF_SPLITS"
[ -n "$TICKERS" ] && TRAIN_ARGS="$TRAIN_ARGS --tickers $TICKERS"

echo "Running: python3 scripts/train_model.py $TRAIN_ARGS"
python3 scripts/train_model.py $TRAIN_ARGS 2>&1 | tee "$LOG_FILE"
[ "${PIPESTATUS[0]}" -ne 0 ] && { echo -e "${RED}❌ Training failed${NC}"; exit 1; }

[ -f "models/model_metadata.json" ] || { echo -e "${RED}❌ models/model_metadata.json missing after training${NC}"; exit 1; }
MODEL_COUNT=$(python3 -c "import json; d=json.load(open('models/model_metadata.json')); print(len(d.get('models', {})))")
DEPLOYABLE=$(python3 -c "import json; d=json.load(open('models/model_metadata.json')); print(sum(1 for m in d['models'].values() if m.get('deployable')))")

ELAPSED=$(( $(date +%s) - START_TIME ))
echo ""
echo -e "${BOLD}${GREEN}=========================================================================="
echo " ✅ TRAINING COMPLETE — ${MODEL_COUNT} model entries (${DEPLOYABLE} deployable)"
echo -e "==========================================================================${NC}"
echo "Total time:  $((ELAPSED / 60))m $((ELAPSED % 60))s"
echo "Logs:        $LOG_DIR"
echo ""
echo -e "${YELLOW}👉 Next: deploy to AWS with  ./deploy.sh${NC}"
