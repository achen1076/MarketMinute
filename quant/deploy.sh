#!/bin/bash
# =============================================================================
# Model Deployment — single entry point
# =============================================================================
# Ships retrained models + metadata to AWS:
#   1. Build & push SageMaker inference image (AWS CodeBuild — no local Docker)
#   2. Upload models/model_metadata.json to S3 (consumed by the webapp)
#   3. Point the SageMaker endpoint at the new image (terraform apply)
#
# Usage:
#   ./deploy.sh                     # full deploy (image + metadata + endpoint)
#   ./deploy.sh --skip-image        # metadata + endpoint only
#   ./deploy.sh --skip-upload       # image + endpoint only
#   ./deploy.sh --skip-terraform    # image + metadata only (print manual cmd)
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

SKIP_IMAGE=false
SKIP_UPLOAD=false
APPLY_TERRAFORM=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-image) SKIP_IMAGE=true; shift ;;
        --skip-upload) SKIP_UPLOAD=true; shift ;;
        --skip-terraform) APPLY_TERRAFORM=false; shift ;;
        -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

START_TIME=$(date +%s)
LOG_DIR="$SCRIPT_DIR/logs/deploy"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
IMAGE_DIGEST_URI=""

echo -e "${BOLD}${CYAN}"
echo "=========================================================================="
echo " MARKETMINUTE DEPLOYMENT PIPELINE"
echo "=========================================================================="
echo -e "${NC}"
echo "Started:       $(date)"
echo "Build image:   $([ "$SKIP_IMAGE" = false ] && echo yes || echo no)"
echo "Upload meta:   $([ "$SKIP_UPLOAD" = false ] && echo yes || echo no)"
echo "Update endpoint: $APPLY_TERRAFORM"
echo ""

# --- Preflight ---
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌ python3 not found${NC}"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}❌ aws CLI not found${NC}"; exit 1; }
aws sts get-caller-identity >/dev/null 2>&1 || { echo -e "${RED}❌ AWS credentials not configured${NC}"; exit 1; }
if [ "$SKIP_IMAGE" = false ]; then
    command -v zip >/dev/null 2>&1 || { echo -e "${RED}❌ zip not found${NC}"; exit 1; }
fi
if [ "$APPLY_TERRAFORM" = true ]; then
    command -v terraform >/dev/null 2>&1 || { echo -e "${RED}❌ terraform not found${NC}"; exit 1; }
fi
[ -f "models/model_metadata.json" ] || { echo -e "${RED}❌ models/model_metadata.json not found — run ./train.sh first${NC}"; exit 1; }
echo -e "${GREEN}✅ Preflight OK${NC}"

# --- Step 1: SageMaker image (CodeBuild) ---
if [ "$SKIP_IMAGE" = false ]; then
    echo ""
    echo -e "${BOLD}${BLUE}── STEP 1: Build & push SageMaker image (CodeBuild) ──${NC}"
    LOG_FILE="$LOG_DIR/image_${TIMESTAMP}.log"

    (cd sagemaker && ./build_in_cloud.sh) 2>&1 | tee "$LOG_FILE"
    [ "${PIPESTATUS[0]}" -ne 0 ] && { echo -e "${RED}❌ Cloud image build failed${NC}"; exit 1; }

    IMAGE_URI_FILE="$SCRIPT_DIR/sagemaker/.last_image_uri"
    [ -f "$IMAGE_URI_FILE" ] || { echo -e "${RED}❌ Image URI file not found${NC}"; exit 1; }
    IMAGE_DIGEST_URI=$(tr -d '\n' < "$IMAGE_URI_FILE")
    echo "$IMAGE_DIGEST_URI" > "$LOG_DIR/last_image_digest.txt"
    echo -e "${GREEN}✅ Image pushed: $IMAGE_DIGEST_URI${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping image build${NC}"
    # Reuse the last pushed image for terraform if available
    if [ -f "$SCRIPT_DIR/sagemaker/.last_image_uri" ]; then
        IMAGE_DIGEST_URI=$(tr -d '\n' < "$SCRIPT_DIR/sagemaker/.last_image_uri")
        echo "Using last pushed image: $IMAGE_DIGEST_URI"
    fi
fi

# --- Step 2: Metadata upload to S3 ---
if [ "$SKIP_UPLOAD" = false ]; then
    echo ""
    echo -e "${BOLD}${BLUE}── STEP 2: Upload model metadata to S3 ──${NC}"
    LOG_FILE="$LOG_DIR/upload_${TIMESTAMP}.log"
    python3 scripts/upload_metadata_to_s3.py 2>&1 | tee "$LOG_FILE"
    [ "${PIPESTATUS[0]}" -ne 0 ] && { echo -e "${RED}❌ Metadata upload failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ Metadata uploaded${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping metadata upload${NC}"
fi

# --- Step 3: Terraform endpoint update ---
if [ "$APPLY_TERRAFORM" = true ]; then
    echo ""
    echo -e "${BOLD}${BLUE}── STEP 3: Update SageMaker endpoint (terraform) ──${NC}"

    TF_DIR="$SCRIPT_DIR/../infrastructure/terraform"
    [ -d "$TF_DIR" ] || { echo -e "${RED}❌ Terraform dir not found: $TF_DIR${NC}"; exit 1; }
    [ -n "$IMAGE_DIGEST_URI" ] || { echo -e "${RED}❌ No image URI available — build an image first or run with --skip-terraform${NC}"; exit 1; }

    LOG_FILE="$LOG_DIR/terraform_${TIMESTAMP}.log"
    (cd "$TF_DIR" && terraform apply -auto-approve -var="sagemaker_image_uri=$IMAGE_DIGEST_URI") 2>&1 | tee "$LOG_FILE"
    [ "${PIPESTATUS[0]}" -ne 0 ] && { echo -e "${RED}❌ Terraform apply failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ SageMaker endpoint updated${NC}"
elif [ -n "$IMAGE_DIGEST_URI" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Endpoint NOT updated. To update manually:${NC}"
    echo "   cd ../infrastructure/terraform"
    echo "   terraform apply -var=\"sagemaker_image_uri=$IMAGE_DIGEST_URI\""
fi

ELAPSED=$(( $(date +%s) - START_TIME ))
echo ""
echo -e "${BOLD}${GREEN}=========================================================================="
echo " ✅ DEPLOYMENT COMPLETE"
echo -e "==========================================================================${NC}"
echo "Total time:  $((ELAPSED / 60))m $((ELAPSED % 60))s"
echo "Logs:        $LOG_DIR"
