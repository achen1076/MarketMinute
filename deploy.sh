#!/bin/bash
set -e

# Master deployment script for MarketMinute ML infrastructure
# Deploys SageMaker endpoint, Lambda orchestrator, and uploads Schwab token

echo "🚀 MarketMinute Deployment Script"
echo "=================================="
echo

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
SKIP_SAGEMAKER=false
SKIP_LAMBDA=false
SKIP_TOKEN=false
FULL_DEPLOY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-sagemaker)
      SKIP_SAGEMAKER=true
      shift
      ;;
    --skip-lambda)
      SKIP_LAMBDA=true
      shift
      ;;
    --skip-token)
      SKIP_TOKEN=true
      shift
      ;;
    --full)
      FULL_DEPLOY=true
      shift
      ;;
    --help)
      echo "Usage: ./deploy.sh [OPTIONS]"
      echo
      echo "Options:"
      echo "  --full              Full deployment (terraform init + apply all)"
      echo "  --skip-sagemaker    Skip SageMaker container rebuild"
      echo "  --skip-lambda       Skip Lambda container rebuild"
      echo "  --skip-token        Skip Schwab token upload"
      echo "  --help              Show this help message"
      echo
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}📍 Project root: $PROJECT_ROOT${NC}"
echo

# Step 1: Initialize Terraform (if full deploy)
if [ "$FULL_DEPLOY" = true ]; then
  echo -e "${BLUE}Step 1: Initializing Terraform${NC}"
  cd infrastructure/terraform
  terraform init
  echo -e "${GREEN}✅ Terraform initialized${NC}"
  echo
  cd "$PROJECT_ROOT"
fi

# Step 2: Create Secrets Manager secret
echo -e "${BLUE}Step 2: Creating AWS Secrets Manager secret${NC}"
cd infrastructure/terraform
terraform apply -target=aws_secretsmanager_secret.schwab_token -target=aws_secretsmanager_secret_version.schwab_token -auto-approve
echo -e "${GREEN}✅ Secrets Manager configured${NC}"
echo
cd "$PROJECT_ROOT"

# Step 3: Upload Schwab token
if [ "$SKIP_TOKEN" = false ]; then
  echo -e "${BLUE}Step 3: Uploading Schwab token${NC}"
  if [ -f "quant/schwab_token.json" ]; then
    cd infrastructure/scripts
    ./upload_schwab_token.sh
    echo -e "${GREEN}✅ Token uploaded${NC}"
    cd "$PROJECT_ROOT"
  else
    echo -e "${YELLOW}⚠️  Warning: schwab_token.json not found, skipping token upload${NC}"
    echo -e "${YELLOW}   Lambda will use dummy data until token is uploaded${NC}"
  fi
  echo
else
  echo -e "${YELLOW}⏭️  Skipping token upload (--skip-token)${NC}"
  echo
fi

# Step 4: Build and push SageMaker container
if [ "$SKIP_SAGEMAKER" = false ]; then
  echo -e "${BLUE}Step 4: Building SageMaker container${NC}"
  cd quant/sagemaker
  ./deploy_sagemaker.sh
  echo -e "${GREEN}✅ SageMaker container pushed${NC}"
  echo
  cd "$PROJECT_ROOT"
  
  # Update SageMaker model
  echo -e "${BLUE}Step 5: Updating SageMaker model${NC}"
  cd infrastructure/terraform
  terraform apply -replace=aws_sagemaker_model.quant -auto-approve
  echo -e "${GREEN}✅ SageMaker model updated${NC}"
  echo
  cd "$PROJECT_ROOT"
else
  echo -e "${YELLOW}⏭️  Skipping SageMaker rebuild (--skip-sagemaker)${NC}"
  echo
fi

# Step 6: Build and push Lambda container
if [ "$SKIP_LAMBDA" = false ]; then
  echo -e "${BLUE}Step 6: Building Lambda container${NC}"
  cd quant/lambda
  ./deploy_lambda.sh
  echo -e "${GREEN}✅ Lambda container pushed${NC}"
  echo
  cd "$PROJECT_ROOT"
else
  echo -e "${YELLOW}⏭️  Skipping Lambda rebuild (--skip-lambda)${NC}"
  echo
fi

# Step 7: Deploy all infrastructure
echo -e "${BLUE}Step 7: Deploying all infrastructure${NC}"
cd infrastructure/terraform
terraform apply -auto-approve
echo -e "${GREEN}✅ Infrastructure deployed${NC}"
echo
cd "$PROJECT_ROOT"

# Step 8: Get outputs
echo -e "${BLUE}Step 8: Deployment Summary${NC}"
echo "=================================="
cd infrastructure/terraform
terraform output -json > /tmp/tf_output.json

LAMBDA_URL=$(terraform output -raw lambda_function_url 2>/dev/null || echo "Not deployed")
SAGEMAKER_ENDPOINT=$(terraform output -raw sagemaker_endpoint_name 2>/dev/null || echo "Not deployed")
SECRET_NAME=$(terraform output -raw schwab_token_secret_name 2>/dev/null || echo "Not created")

echo
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo
echo "📊 Resources:"
echo "  • SageMaker Endpoint: $SAGEMAKER_ENDPOINT"
echo "  • Lambda Function URL: $LAMBDA_URL"
echo "  • Secrets Manager: $SECRET_NAME"
echo
echo "🧪 Test your deployment:"
echo "  curl -X POST $LAMBDA_URL \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"task\":\"daily_analysis\"}'"
echo
echo "📝 Next steps:"
echo "  1. Test the Lambda endpoint (command above)"
echo "  2. Check CloudWatch logs: aws logs tail /aws/lambda/marketminute-dev-orchestrator --follow"
echo "  3. Monitor SageMaker: aws logs tail /aws/sagemaker/Endpoints/marketminute-dev-endpoint --follow"
echo
echo -e "${GREEN}✨ Your ML infrastructure is ready!${NC}"
echo

cd "$PROJECT_ROOT"
