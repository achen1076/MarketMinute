#!/bin/bash
# =============================================================================
# Full Model Retraining Pipeline
# =============================================================================
# Runs end-to-end:
#   1. Prep data (fetch from FMP, generate processed CSVs)
#   2. Train models (auto mode: picks best of return/lgbm per ticker)
#   3. Build & push SageMaker Docker image to ECR (via AWS CodeBuild — no local Docker needed)
#   4. Upload model_metadata.json to S3
#   5. (Optional) Apply Terraform to update SageMaker endpoint
#
# Usage:
#   ./retrain_pipeline.sh                       # full pipeline, auto model, tune+walk-forward
#   ./retrain_pipeline.sh --skip-prep           # skip data prep
#   ./retrain_pipeline.sh --skip-train          # skip training
#   ./retrain_pipeline.sh --skip-deploy         # skip docker build/push
#   ./retrain_pipeline.sh --skip-upload         # skip metadata upload
#   ./retrain_pipeline.sh --no-tune             # skip hyperparameter tuning (faster)
#   ./retrain_pipeline.sh --no-walk-forward     # skip walk-forward validation
#   ./retrain_pipeline.sh --model lgbm          # override model type (default: auto)
#   ./retrain_pipeline.sh --skip-terraform      # skip auto-updating SageMaker endpoint
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Defaults
SKIP_PREP=false
SKIP_TRAIN=false
SKIP_DEPLOY=false
SKIP_UPLOAD=false
APPLY_TERRAFORM=true
MODEL_TYPE="auto"
TUNE=true
WALK_FORWARD=true
WF_SPLITS=5

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-prep) SKIP_PREP=true; shift ;;
        --skip-train) SKIP_TRAIN=true; shift ;;
        --skip-deploy) SKIP_DEPLOY=true; shift ;;
        --skip-upload) SKIP_UPLOAD=true; shift ;;
        --no-tune) TUNE=false; shift ;;
        --no-walk-forward) WALK_FORWARD=false; shift ;;
        --apply-terraform) APPLY_TERRAFORM=true; shift ;;
        --skip-terraform) APPLY_TERRAFORM=false; shift ;;
        --model) MODEL_TYPE="$2"; shift 2 ;;
        --wf-splits) WF_SPLITS="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,22p' "$0"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Resolve script directory (quant/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

START_TIME=$(date +%s)
LOG_DIR="$SCRIPT_DIR/logs/retrain"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BOLD}${CYAN}"
echo "=========================================================================="
echo " MARKETMINUTE FULL RETRAIN PIPELINE"
echo "=========================================================================="
echo -e "${NC}"
echo "Started:        $(date)"
echo "Working dir:    $SCRIPT_DIR"
echo "Log dir:        $LOG_DIR"
echo ""
echo "Config:"
echo "  Skip prep:         $SKIP_PREP"
echo "  Skip train:        $SKIP_TRAIN"
echo "  Skip deploy:       $SKIP_DEPLOY"
echo "  Skip upload:       $SKIP_UPLOAD"
echo "  Update endpoint:   $APPLY_TERRAFORM (terraform apply)"
echo "  Model type:        $MODEL_TYPE"
echo "  Tune:              $TUNE"
echo "  Walk-forward:      $WALK_FORWARD (splits=$WF_SPLITS)"
echo ""

# Helper: print step header
step() {
    echo ""
    echo -e "${BOLD}${BLUE}=========================================================================="
    echo -e " STEP $1: $2"
    echo -e "==========================================================================${NC}"
    echo ""
}

# Helper: print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Helper: print error and exit
fail() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# =============================================================================
# Preflight checks
# =============================================================================
step "0" "Preflight Checks"

command -v python3 >/dev/null 2>&1 || fail "python3 not found"
success "python3 found"

if [ "$SKIP_DEPLOY" = false ]; then
    # Image builds run in AWS CodeBuild — no local Docker required.
    command -v aws >/dev/null 2>&1 || fail "aws CLI not found"
    aws sts get-caller-identity >/dev/null 2>&1 || fail "AWS credentials not configured"
    success "AWS credentials OK"

    command -v zip >/dev/null 2>&1 || fail "zip not found (needed to package build context)"
    success "zip found"
fi

if [ "$APPLY_TERRAFORM" = true ]; then
    command -v terraform >/dev/null 2>&1 || fail "terraform not found"
    success "terraform found"
fi

# =============================================================================
# Step 1: Data prep
# =============================================================================
if [ "$SKIP_PREP" = false ]; then
    step "1" "Prep Data (FMP fetch + feature engineering)"
    LOG_FILE="$LOG_DIR/prep_${TIMESTAMP}.log"
    echo "Logging to: $LOG_FILE"
    python3 scripts/prep_data.py 2>&1 | tee "$LOG_FILE"
    PREP_EXIT=${PIPESTATUS[0]}
    if [ "$PREP_EXIT" -ne 0 ]; then
        fail "Data prep failed (exit $PREP_EXIT)"
    fi
    success "Data prep complete"
else
    echo ""
    echo -e "${YELLOW}⏭️  Skipping data prep${NC}"
fi

# =============================================================================
# Step 2: Train models
# =============================================================================
if [ "$SKIP_TRAIN" = false ]; then
    step "2" "Train Models ($MODEL_TYPE)"
    LOG_FILE="$LOG_DIR/train_${TIMESTAMP}.log"
    echo "Logging to: $LOG_FILE"

    TRAIN_ARGS="--model $MODEL_TYPE"
    [ "$TUNE" = true ] && TRAIN_ARGS="$TRAIN_ARGS --tune"
    if [ "$WALK_FORWARD" = true ]; then
        TRAIN_ARGS="$TRAIN_ARGS --walk-forward --wf-splits $WF_SPLITS"
    fi

    echo "Running: python3 scripts/train_model.py $TRAIN_ARGS"
    echo ""
    python3 scripts/train_model.py $TRAIN_ARGS 2>&1 | tee "$LOG_FILE"
    TRAIN_EXIT=${PIPESTATUS[0]}
    if [ "$TRAIN_EXIT" -ne 0 ]; then
        fail "Training failed (exit $TRAIN_EXIT)"
    fi
    success "Training complete"

    # Sanity-check that metadata exists
    if [ ! -f "models/model_metadata.json" ]; then
        fail "models/model_metadata.json not found after training"
    fi
    MODEL_COUNT=$(python3 -c "import json; d=json.load(open('models/model_metadata.json')); print(len(d.get('models', {})))")
    success "Metadata contains $MODEL_COUNT model entries"
else
    echo ""
    echo -e "${YELLOW}⏭️  Skipping training${NC}"
fi

# =============================================================================
# Step 3: Build & push SageMaker image
# =============================================================================
if [ "$SKIP_DEPLOY" = false ]; then
    step "3" "Build & Push SageMaker Docker Image"
    LOG_FILE="$LOG_DIR/deploy_${TIMESTAMP}.log"
    echo "Logging to: $LOG_FILE"

    cd "$SCRIPT_DIR/sagemaker"
    ./build_in_cloud.sh 2>&1 | tee "$LOG_FILE"
    DEPLOY_EXIT=${PIPESTATUS[0]}
    cd "$SCRIPT_DIR"

    if [ "$DEPLOY_EXIT" -ne 0 ]; then
        fail "Cloud build failed (exit $DEPLOY_EXIT)"
    fi

    # Read image URI written by build_in_cloud.sh
    IMAGE_URI_FILE="$SCRIPT_DIR/sagemaker/.last_image_uri"
    if [ -f "$IMAGE_URI_FILE" ]; then
        IMAGE_DIGEST_URI=$(cat "$IMAGE_URI_FILE" | tr -d '\n')
        success "Image pushed: $IMAGE_DIGEST_URI"
        echo "$IMAGE_DIGEST_URI" > "$LOG_DIR/last_image_digest.txt"
    else
        fail "Image URI file not found at $IMAGE_URI_FILE"
    fi
else
    echo ""
    echo -e "${YELLOW}⏭️  Skipping SageMaker deploy${NC}"
fi

# =============================================================================
# Step 4: Upload metadata to S3
# =============================================================================
if [ "$SKIP_UPLOAD" = false ]; then
    step "4" "Upload Model Metadata to S3"
    LOG_FILE="$LOG_DIR/upload_${TIMESTAMP}.log"
    echo "Logging to: $LOG_FILE"

    python3 scripts/upload_metadata_to_s3.py 2>&1 | tee "$LOG_FILE"
    UPLOAD_EXIT=${PIPESTATUS[0]}
    if [ "$UPLOAD_EXIT" -ne 0 ]; then
        fail "Metadata upload failed (exit $UPLOAD_EXIT)"
    fi
    success "Metadata uploaded to S3"
else
    echo ""
    echo -e "${YELLOW}⏭️  Skipping metadata upload${NC}"
fi

# =============================================================================
# Step 5: Terraform apply (optional)
# =============================================================================
if [ "$APPLY_TERRAFORM" = true ]; then
    step "5" "Update SageMaker Endpoint (Terraform)"

    TF_DIR="$SCRIPT_DIR/../infrastructure/terraform"
    if [ ! -d "$TF_DIR" ]; then
        fail "Terraform directory not found: $TF_DIR"
    fi

    if [ -z "$IMAGE_DIGEST_URI" ]; then
        fail "No image digest URI available — cannot run terraform apply"
    fi

    LOG_FILE="$LOG_DIR/terraform_${TIMESTAMP}.log"
    echo "Logging to: $LOG_FILE"

    cd "$TF_DIR"
    terraform apply -auto-approve -var="sagemaker_image_uri=$IMAGE_DIGEST_URI" 2>&1 | tee "$LOG_FILE"
    TF_EXIT=${PIPESTATUS[0]}
    cd "$SCRIPT_DIR"

    if [ "$TF_EXIT" -ne 0 ]; then
        fail "Terraform apply failed (exit $TF_EXIT)"
    fi
    success "SageMaker endpoint updated"
fi

# =============================================================================
# Done
# =============================================================================
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
MINS=$((ELAPSED / 60))
SECS=$((ELAPSED % 60))

echo ""
echo -e "${BOLD}${GREEN}"
echo "=========================================================================="
echo " ✅ PIPELINE COMPLETE"
echo "=========================================================================="
echo -e "${NC}"
echo "Total time:    ${MINS}m ${SECS}s"
echo "Logs:          $LOG_DIR"
echo ""

if [ "$SKIP_DEPLOY" = false ] && [ "$APPLY_TERRAFORM" = false ] && [ -n "$IMAGE_DIGEST_URI" ]; then
    echo -e "${YELLOW}⚠️  Endpoint was NOT updated (--skip-terraform was set).${NC}"
    echo -e "${YELLOW}   To update manually:${NC}"
    echo ""
    echo "   cd ../infrastructure/terraform"
    echo "   terraform apply -var=\"sagemaker_image_uri=$IMAGE_DIGEST_URI\""
    echo ""
fi
