#!/bin/bash
set -e

# ============================================================================
# SageMaker Image Deployment Script
# ============================================================================
# Builds SageMaker inference image and pushes to ECR.
# Terraform handles CreateModel / CreateEndpoint.
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_REGION="us-east-1"
REPO_NAME="marketminute-sagemaker"
IMAGE_TAG="latest"

echo "============================================"
echo "🚀 SageMaker Image Deployment"
echo "============================================"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Error: Could not get AWS account ID. Check AWS credentials.${NC}"
    exit 1
fi

ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo "Account:   $ACCOUNT_ID"
echo "Region:    $AWS_REGION"
echo "Repo:      $REPO_NAME"
echo "Image URI: $ECR_URI:$IMAGE_TAG"
echo

# 1) Ensure repo exists
echo -e "${BLUE}📦 Checking / creating ECR repo...${NC}"
if aws ecr describe-repositories --repository-names "${REPO_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Repo already exists${NC}"
else
    aws ecr create-repository \
        --repository-name "${REPO_NAME}" \
        --image-scanning-configuration scanOnPush=true \
        --region "${AWS_REGION}" >/dev/null
    echo -e "${GREEN}✅ Repo created${NC}"
fi
echo

# 2) Login
echo -e "${BLUE}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region "${AWS_REGION}" \
    | docker login --username AWS --password-stdin "${ECR_URI}"
echo -e "${GREEN}✅ Logged in${NC}"
echo

# 3) Prepare build context with models and src code
echo -e "${BLUE}📦 Preparing build context...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

rm -rf models src
mkdir -p models

# Copy return models (preferred) and lgbm models as fallback
if [ -d "../models/return" ]; then
    cp ../models/return/*.pkl models/ 2>/dev/null || true
    RETURN_COUNT=$(ls -1 models/*_return.pkl 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Copied $RETURN_COUNT return models${NC}"
fi

if [ -d "../models/lgbm" ]; then
    cp ../models/lgbm/*.pkl models/ 2>/dev/null || true
    LGBM_COUNT=$(ls -1 models/*_lgbm.pkl 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Copied $LGBM_COUNT lgbm models${NC}"
fi

# Also copy model metadata for the endpoint
if [ -f "../models/model_metadata.json" ]; then
    cp ../models/model_metadata.json models/
    echo -e "${GREEN}✅ Copied model_metadata.json${NC}"
fi

TOTAL_MODELS=$(ls -1 models/*.pkl 2>/dev/null | wc -l | tr -d ' ')
if [ "$TOTAL_MODELS" -eq 0 ]; then
    echo -e "${RED}❌ Error: No models found${NC}"
    exit 1
fi

cp -r ../src src
echo -e "${GREEN}✅ Total models: $TOTAL_MODELS${NC}"
echo

# 4) Build image (disable provenance to avoid OCI manifest issues with SageMaker)
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build \
    --platform linux/amd64 \
    --provenance=false \
    --no-cache \
    -t "${REPO_NAME}:${IMAGE_TAG}" \
    .

echo -e "${GREEN}✅ Image built${NC}"
echo

# 5) Tag & push
echo -e "${BLUE}⬆️ Tagging and pushing...${NC}"
docker tag "${REPO_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"

# Verify push succeeded
echo ""
echo -e "${BLUE}🔍 Verifying push...${NC}"
PUSHED_DIGEST=$(aws ecr describe-images \
    --repository-name "${REPO_NAME}" \
    --image-ids imageTag="${IMAGE_TAG}" \
    --region "${AWS_REGION}" \
    --query 'imageDetails[0].imageDigest' \
    --output text 2>/dev/null)

if [ -z "$PUSHED_DIGEST" ] || [ "$PUSHED_DIGEST" == "None" ]; then
    echo -e "${RED}❌ Error: Could not verify image push${NC}"
    exit 1
fi

PUSHED_AT=$(aws ecr describe-images \
    --repository-name "${REPO_NAME}" \
    --image-ids imageTag="${IMAGE_TAG}" \
    --region "${AWS_REGION}" \
    --query 'imageDetails[0].imagePushedAt' \
    --output text 2>/dev/null)

echo -e "${GREEN}✅ Image verified in ECR${NC}"
echo "   Digest: $PUSHED_DIGEST"
echo "   Pushed: $PUSHED_AT"

# Cleanup build context
rm -rf models src

echo ""
echo "============================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "============================================"
echo ""
echo "Image URI: ${ECR_URI}:${IMAGE_TAG}"
echo ""
echo -e "${YELLOW}👉 To update SageMaker endpoint, run:${NC}"
echo "   cd ../../infrastructure/terraform && terraform apply"
echo ""
