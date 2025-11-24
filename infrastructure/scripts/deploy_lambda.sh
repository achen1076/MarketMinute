#!/bin/bash

set -e

# -------------------------
# Configuration
# -------------------------
AWS_REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
FUNCTION_NAME="marketminute-quant-analysis"
ECR_REPO_NAME="marketminute-quant"
IMAGE_TAG="latest"

QUANT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../quant" && pwd)"

echo "🚀 Deploying MarketMinute Quant Lambda (Container Image)"
echo "Account: $ACCOUNT_ID"
echo "Region:  $AWS_REGION"
echo "Quant Dir: $QUANT_DIR"
echo ""

# -------------------------
# Step 1 — Ensure ECR repo exists
# -------------------------
echo "📦 Checking ECR repository..."
if ! aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region $AWS_REGION >/dev/null 2>&1; then
  echo "   Creating ECR repository..."
  aws ecr create-repository \
    --repository-name $ECR_REPO_NAME \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true >/dev/null
  echo "   ✔ ECR repository created"
else
  echo "   ✔ Repository exists"
fi

ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"
echo "Repo URI: $ECR_URI"
echo ""

# -------------------------
# Step 2 — Login to ECR
# -------------------------
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_URI"
echo "✔ Logged in"
echo ""

# -------------------------
# Step 3 — Build Docker image (from quant directory)
# -------------------------
echo "🐳 Building Docker image from quant/ ..."

cd "$QUANT_DIR"

docker build \
  --platform linux/amd64 \
  -t $ECR_REPO_NAME:$IMAGE_TAG .

echo "✔ Build complete"
echo ""

# -------------------------
# Step 4 — Tag image
# -------------------------
echo "🏷 Tagging image..."
docker tag $ECR_REPO_NAME:$IMAGE_TAG $ECR_URI:$IMAGE_TAG
echo "✔ Tagged"
echo ""

# -------------------------
# Step 5 — Push image
# -------------------------
echo "⬆️  Pushing image to ECR..."
docker push $ECR_URI:$IMAGE_TAG
echo "✔ Pushed"
echo ""

# -------------------------
# Step 6 — Update Lambda
# -------------------------
echo "🔄 Updating Lambda function..."

aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --image-uri "$ECR_URI:$IMAGE_TAG" \
  --region "$AWS_REGION"

echo "✔ Lambda updated"
echo ""

echo "🎉 Deployment finished!"
echo "Lambda is now using: $ECR_URI:$IMAGE_TAG"
