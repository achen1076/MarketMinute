#!/bin/bash
set -e

echo "🚀 Deploying ML Services to EC2"
echo "================================"

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROJECT_NAME="marketminute"

# ECR repositories
SENTIMENT_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-sentiment"
RELEVANCE_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-relevance"

echo ""
echo "📦 Step 1: Build and push Docker images to ECR (linux/amd64)"

# Login to ECR first
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build sentiment for AMD64
echo "Building sentiment service for linux/amd64..."
cd ../services/sentiment
docker build --platform linux/amd64 -t ${PROJECT_NAME}-sentiment:latest .
docker tag ${PROJECT_NAME}-sentiment:latest ${SENTIMENT_REPO}:latest
docker push ${SENTIMENT_REPO}:latest
echo "✅ Sentiment image pushed"

# Build relevance for AMD64
echo "Building relevance service for linux/amd64..."
cd ../relevance
docker build --platform linux/amd64 -t ${PROJECT_NAME}-relevance:latest .
docker tag ${PROJECT_NAME}-relevance:latest ${RELEVANCE_REPO}:latest
docker push ${RELEVANCE_REPO}:latest
echo "✅ Relevance image pushed"

echo ""
echo "🔧 Step 2: Deploy EC2 infrastructure with Terraform"
cd ../../infrastructure/terraform

terraform init -upgrade
terraform apply -auto-approve

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service URLs:"
terraform output sentiment_service_url
terraform output relevance_service_url
echo ""
echo "💡 Update your webapp .env with these URLs"
echo ""
echo "💰 Cost: ~\$32/month for t3.medium running 24/7"
