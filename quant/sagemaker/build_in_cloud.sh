#!/bin/bash
# =============================================================================
# Cloud-based SageMaker Image Build
# =============================================================================
# Builds the SageMaker image on AWS CodeBuild (no local Docker needed).
#
# Flow:
#   1. Package Dockerfile + src/ + models/ into a zip
#   2. Upload zip to S3 (bucket created by terraform)
#   3. Start CodeBuild project
#   4. Stream logs until build completes
#   5. Print resulting image URI (with digest) for terraform to consume
#
# Requires (one-time):
#   cd infrastructure/terraform && terraform apply
#   (creates aws_codebuild_project + aws_s3_bucket + IAM role)
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

AWS_REGION="us-east-1"
PROJECT_NAME="marketminute-dev-sagemaker-build"
REPO_NAME="marketminute-sagemaker"
IMAGE_TAG="latest"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "============================================"
echo "☁️  SageMaker Image Build (CodeBuild)"
echo "============================================"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="marketminute-dev-build-artifacts-${ACCOUNT_ID}"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo "Account:   $ACCOUNT_ID"
echo "Region:    $AWS_REGION"
echo "Bucket:    $BUCKET"
echo "Project:   $PROJECT_NAME"
echo

# Verify CodeBuild project exists
if ! aws codebuild batch-get-projects --names "$PROJECT_NAME" --region "$AWS_REGION" --query 'projects[0].name' --output text 2>/dev/null | grep -q "$PROJECT_NAME"; then
    echo -e "${RED}❌ CodeBuild project '$PROJECT_NAME' not found.${NC}"
    echo -e "${YELLOW}Run: cd infrastructure/terraform && terraform apply${NC}"
    exit 1
fi

# 1) Prepare build context
echo -e "${BLUE}📦 Preparing build context...${NC}"
rm -rf models src
mkdir -p models

if [ -d "../models/return" ]; then
    cp ../models/return/*.pkl models/ 2>/dev/null || true
fi
if [ -d "../models/lgbm" ]; then
    cp ../models/lgbm/*.pkl models/ 2>/dev/null || true
fi
if [ -f "../models/model_metadata.json" ]; then
    cp ../models/model_metadata.json models/
fi

TOTAL_MODELS=$(ls -1 models/*.pkl 2>/dev/null | wc -l | tr -d ' ')
if [ "$TOTAL_MODELS" -eq 0 ]; then
    echo -e "${RED}❌ No models found in ../models/${NC}"
    exit 1
fi
echo -e "${GREEN}✅ $TOTAL_MODELS models staged${NC}"

cp -r ../src src
echo -e "${GREEN}✅ src/ copied${NC}"

# 2) Create zip (exclude junk)
echo -e "${BLUE}🗜️  Creating build context zip...${NC}"
ZIP_FILE="sagemaker-build-context.zip"
rm -f "$ZIP_FILE"
zip -rq "$ZIP_FILE" . \
    -x '*.pyc' '*/__pycache__/*' '*/.DS_Store' "$ZIP_FILE" 'build_in_cloud.sh' 'deploy_sagemaker.sh' 'deploy.py'
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo -e "${GREEN}✅ Zip created ($ZIP_SIZE)${NC}"

# 3) Upload to S3
echo -e "${BLUE}⬆️  Uploading to s3://${BUCKET}/${ZIP_FILE}...${NC}"
aws s3 cp "$ZIP_FILE" "s3://${BUCKET}/${ZIP_FILE}" --region "$AWS_REGION" --only-show-errors
echo -e "${GREEN}✅ Uploaded${NC}"

# 4) Start CodeBuild
echo -e "${BLUE}🚀 Starting CodeBuild...${NC}"
BUILD_ID=$(aws codebuild start-build \
    --project-name "$PROJECT_NAME" \
    --region "$AWS_REGION" \
    --query 'build.id' \
    --output text)
echo -e "${GREEN}✅ Build started: $BUILD_ID${NC}"
echo

# 5) Poll build status with progress
echo -e "${BLUE}⏳ Waiting for build to complete (typically 5-10 min)...${NC}"
LAST_PHASE=""
while true; do
    STATUS_JSON=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --region "$AWS_REGION" --query 'builds[0]' --output json)
    STATUS=$(echo "$STATUS_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('buildStatus','UNKNOWN'))")
    PHASE=$(echo "$STATUS_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('currentPhase',''))")

    if [ "$PHASE" != "$LAST_PHASE" ]; then
        echo "   [$(date +%H:%M:%S)] Phase: $PHASE"
        LAST_PHASE="$PHASE"
    fi

    case "$STATUS" in
        SUCCEEDED)
            echo -e "${GREEN}✅ Build SUCCEEDED${NC}"
            break
            ;;
        FAILED|FAULT|TIMED_OUT|STOPPED)
            echo -e "${RED}❌ Build $STATUS${NC}"
            echo -e "${YELLOW}View logs:${NC}"
            echo "  aws logs tail /aws/codebuild/$PROJECT_NAME --region $AWS_REGION --since 15m"
            exit 1
            ;;
        IN_PROGRESS)
            sleep 15
            ;;
        *)
            sleep 15
            ;;
    esac
done
echo

# 6) Get resulting image URI (with digest) that CodeBuild wrote to S3
echo -e "${BLUE}🔍 Fetching image URI...${NC}"
IMAGE_URI=$(aws s3 cp "s3://${BUCKET}/last_build_image_uri.txt" - --region "$AWS_REGION" 2>/dev/null | tr -d '\n' || true)

if [ -z "$IMAGE_URI" ]; then
    # Fallback: compute URI from latest ECR digest
    DIGEST=$(aws ecr describe-images \
        --repository-name "$REPO_NAME" \
        --image-ids imageTag="$IMAGE_TAG" \
        --region "$AWS_REGION" \
        --query 'imageDetails[0].imageDigest' \
        --output text)
    IMAGE_URI="${ECR_URI}@${DIGEST}"
fi

# 7) Cleanup local build context
rm -rf models src "$ZIP_FILE"

echo -e "${GREEN}✅ Image ready${NC}"
echo ""
echo "============================================"
echo -e "${GREEN}✅ CLOUD BUILD COMPLETE${NC}"
echo "============================================"
echo ""
echo "Image URI: $IMAGE_URI"
echo ""
echo -e "${YELLOW}👉 Update SageMaker endpoint:${NC}"
echo "   cd ../../infrastructure/terraform"
echo "   terraform apply -var=\"sagemaker_image_uri=${IMAGE_URI}\""
echo ""

# Write URI to a file so retrain_pipeline.sh can pick it up
echo "$IMAGE_URI" > "$SCRIPT_DIR/.last_image_uri"
