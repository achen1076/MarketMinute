#!/bin/bash
# =============================================================================
# Cloud-based Lambda Image Build
# =============================================================================
# Builds the orchestrator Lambda image on AWS CodeBuild (no local Docker).
# Reuses the same CodeBuild project as the SageMaker build by overriding
# REPO_NAME (env var) and S3 source location at build start time.
#
# After the image is in ECR, this script also updates the Lambda function
# to use the new image (so changes take effect immediately).
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

AWS_REGION="us-east-1"
PROJECT_NAME="marketminute-dev-sagemaker-build"   # reused
REPO_NAME="marketminute-lambda"
IMAGE_TAG="latest"
LAMBDA_FUNCTION_NAME="marketminute-dev-orchestrator"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "============================================"
echo "☁️  Lambda Image Build (CodeBuild)"
echo "============================================"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="marketminute-dev-build-artifacts-${ACCOUNT_ID}"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo "Account:   $ACCOUNT_ID"
echo "Region:    $AWS_REGION"
echo "Bucket:    $BUCKET"
echo "Repo:      $REPO_NAME"
echo

# Ensure ECR repo exists
if ! aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    aws ecr create-repository --repository-name "$REPO_NAME" \
        --image-scanning-configuration scanOnPush=true \
        --region "$AWS_REGION" >/dev/null
    echo -e "${GREEN}✅ Created ECR repo $REPO_NAME${NC}"
fi

# 1) Prepare build context
echo -e "${BLUE}📦 Preparing build context...${NC}"
rm -rf src
if [ ! -d "../src" ]; then
    echo -e "${RED}❌ ../src not found${NC}"
    exit 1
fi
cp -r ../src src
echo -e "${GREEN}✅ src/ copied${NC}"

# 2) Create zip
ZIP_FILE="lambda-build-context.zip"
rm -f "$ZIP_FILE"
zip -rq "$ZIP_FILE" . \
    -x '*.pyc' '*/__pycache__/*' '*/.DS_Store' "$ZIP_FILE" 'build_in_cloud.sh' 'deploy_lambda.sh'
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo -e "${GREEN}✅ Zip created ($ZIP_SIZE)${NC}"

# 3) Upload to S3
echo -e "${BLUE}⬆️  Uploading to s3://${BUCKET}/${ZIP_FILE}...${NC}"
aws s3 cp "$ZIP_FILE" "s3://${BUCKET}/${ZIP_FILE}" --region "$AWS_REGION" --only-show-errors
echo -e "${GREEN}✅ Uploaded${NC}"

# 4) Start CodeBuild with overrides (different repo + different source zip)
echo -e "${BLUE}🚀 Starting CodeBuild...${NC}"
BUILD_ID=$(aws codebuild start-build \
    --project-name "$PROJECT_NAME" \
    --region "$AWS_REGION" \
    --source-location-override "${BUCKET}/${ZIP_FILE}" \
    --environment-variables-override "name=REPO_NAME,value=${REPO_NAME},type=PLAINTEXT" \
    --query 'build.id' \
    --output text)
echo -e "${GREEN}✅ Build started: $BUILD_ID${NC}"
echo

# 5) Poll
echo -e "${BLUE}⏳ Waiting for build...${NC}"
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
        SUCCEEDED) echo -e "${GREEN}✅ Build SUCCEEDED${NC}"; break ;;
        FAILED|FAULT|TIMED_OUT|STOPPED)
            echo -e "${RED}❌ Build $STATUS${NC}"
            echo "  aws logs tail /aws/codebuild/$PROJECT_NAME --region $AWS_REGION --since 15m"
            exit 1
            ;;
        IN_PROGRESS|*) sleep 15 ;;
    esac
done
echo

# 6) Get image digest
DIGEST=$(aws ecr describe-images \
    --repository-name "$REPO_NAME" \
    --image-ids imageTag="$IMAGE_TAG" \
    --region "$AWS_REGION" \
    --query 'imageDetails[0].imageDigest' \
    --output text)
IMAGE_URI="${ECR_URI}@${DIGEST}"
echo -e "${GREEN}✅ Image: $IMAGE_URI${NC}"

# Cleanup
rm -rf src "$ZIP_FILE"

# 7) Update Lambda to use new image
echo -e "${BLUE}🔄 Updating Lambda function code...${NC}"
aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --image-uri "${ECR_URI}:${IMAGE_TAG}" \
    --region "$AWS_REGION" \
    --query 'LastUpdateStatus' \
    --output text

echo "Waiting for Lambda update..."
aws lambda wait function-updated \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" 2>/dev/null || true

echo -e "${GREEN}✅ Lambda updated${NC}"
echo
echo "============================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "============================================"
echo "Image:    $IMAGE_URI"
echo "Function: $LAMBDA_FUNCTION_NAME"
echo

echo "$IMAGE_URI" > "$SCRIPT_DIR/.last_image_uri"
