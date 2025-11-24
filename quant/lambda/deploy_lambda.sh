#!/bin/bash
set -e

# Simple script: build Lambda image and push to ECR.
# Terraform will handle Lambda function creation/update.

AWS_REGION="us-east-1"
REPO_NAME="marketminute-lambda"
IMAGE_TAG="latest"

echo "🚀 Building Lambda orchestrator image"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo "Account:   $ACCOUNT_ID"
echo "Region:    $AWS_REGION"
echo "Repo:      $REPO_NAME"
echo "Image URI: $ECR_URI:$IMAGE_TAG"
echo

# 1) Ensure repo exists
echo "📦 Checking / creating ECR repo..."
if aws ecr describe-repositories --repository-names "${REPO_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1; then
  echo "✅ Repo already exists"
else
  aws ecr create-repository \
    --repository-name "${REPO_NAME}" \
    --image-scanning-configuration scanOnPush=true \
    --region "${AWS_REGION}" >/dev/null
  echo "✅ Repo created"
fi
echo

# 2) Login
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_URI}"
echo "✅ Logged in"
echo

# 3) Prepare build context with src code
echo "📦 Preparing build context..."
rm -rf src
cp -r ../src src
echo "✅ Copied src/ to build context"
echo

# 4) Build image
echo "🔨 Building Docker image..."
docker build \
  --platform linux/amd64 \
  --provenance=false \
  -t "${REPO_NAME}:${IMAGE_TAG}" \
  .

echo "✅ Image built"
echo

# 4) Tag & push
echo "⬆️ Tagging and pushing..."
docker tag "${REPO_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"

echo
echo "✅ Image pushed to: ${ECR_URI}:${IMAGE_TAG}"
echo
echo "👉 Copy this and put it into terraform.tfvars as lambda_image_uri:"
echo "   ${ECR_URI}:${IMAGE_TAG}"
echo
