#!/bin/bash
set -e

# ============================================================================
# Model Redeployment Script
# ============================================================================
# This script handles the complete workflow of deploying updated ML models:
# 1. Rebuilds Docker images with new model artifacts
# 2. Pushes images to AWS ECR
# 3. Restarts services on EC2 to use the new models
#
# Usage:
#   ./redeploy_models.sh [sentiment|relevance|both]
#
# Prerequisites:
#   - Trained model artifacts must exist in model/ directories
#   - AWS CLI configured with appropriate credentials
#   - EC2 instance ID (will be retrieved from Terraform outputs)
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "============================================"
echo "🚀 ML Model Redeployment Script"
echo "============================================"

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROJECT_NAME="marketminute"

# ECR repositories
SENTIMENT_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-sentiment"
RELEVANCE_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-relevance"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Parse arguments
SERVICE=${1:-both}

if [[ ! "$SERVICE" =~ ^(sentiment|relevance|both)$ ]]; then
    echo -e "${RED}❌ Error: Invalid service name${NC}"
    echo "Usage: $0 [sentiment|relevance|both]"
    exit 1
fi

# ============================================================================
# Function: Check if model artifacts exist
# ============================================================================
check_model_artifacts() {
    local service=$1
    local model_file="$SCRIPT_DIR/$service/model/${service}_classifier.pkl"
    
    if [ ! -f "$model_file" ]; then
        echo -e "${RED}❌ Error: Model file not found: $model_file${NC}"
        echo -e "${YELLOW}💡 Run training first:${NC}"
        echo "   cd $SCRIPT_DIR/$service/scripts"
        echo "   ./train_model.sh"
        return 1
    fi
    
    echo -e "${GREEN}✅ Model artifacts found for $service${NC}"
    return 0
}

# ============================================================================
# Function: Build and push Docker image
# ============================================================================
build_and_push() {
    local service=$1
    local repo=$2
    local port=$3
    
    echo ""
    echo -e "${BLUE}📦 Building $service Docker image...${NC}"
    
    cd "$SCRIPT_DIR/$service"
    
    # Build with --no-cache to ensure fresh image
    docker build --no-cache --platform linux/amd64 -t ${PROJECT_NAME}-${service}:latest .
    
    # Verify uvicorn is installed
    echo "Verifying dependencies..."
    docker run --rm --entrypoint pip ${PROJECT_NAME}-${service}:latest list | grep uvicorn > /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error: uvicorn not found in image${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
    
    # Tag and push to ECR
    echo "Pushing to ECR..."
    docker tag ${PROJECT_NAME}-${service}:latest ${repo}:latest
    docker push ${repo}:latest
    
    echo -e "${GREEN}✅ Image pushed to ECR${NC}"
}

# ============================================================================
# Function: Restart EC2 service
# ============================================================================
restart_ec2_service() {
    local service=$1
    
    echo ""
    echo -e "${BLUE}🔄 Restarting $service service on EC2...${NC}"
    
    # Get EC2 instance ID from Terraform
    cd "$SCRIPT_DIR/../infrastructure/terraform"
    EC2_INSTANCE_ID=$(terraform output -raw ec2_instance_id 2>/dev/null)
    
    if [ -z "$EC2_INSTANCE_ID" ]; then
        echo -e "${RED}❌ Error: Could not get EC2 instance ID from Terraform${NC}"
        echo "Make sure Terraform infrastructure is deployed"
        exit 1
    fi
    
    echo "EC2 Instance: $EC2_INSTANCE_ID"
    
    # Send SSM command to restart service
    COMMAND_ID=$(aws ssm send-command \
        --instance-ids "$EC2_INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters "commands=[
            'cd /opt/ml-services',
            'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com',
            'docker-compose pull $service',
            'docker-compose up -d $service',
            'sleep 10',
            'docker ps | grep $service',
            'curl http://localhost:800$([ \"$service\" = \"sentiment\" ] && echo 1 || echo 2)/health || echo \"Health check pending...\"'
        ]" \
        --region "$AWS_REGION" \
        --query 'Command.CommandId' \
        --output text)
    
    echo "Waiting for service restart..."
    sleep 15
    
    # Check command status
    aws ssm get-command-invocation \
        --command-id "$COMMAND_ID" \
        --instance-id "$EC2_INSTANCE_ID" \
        --region "$AWS_REGION" \
        --query 'StandardOutputContent' \
        --output text
    
    echo -e "${GREEN}✅ Service restarted${NC}"
}

# ============================================================================
# Main Execution
# ============================================================================

# Login to ECR
echo ""
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Process sentiment service
if [[ "$SERVICE" == "sentiment" || "$SERVICE" == "both" ]]; then
    echo ""
    echo "============================================"
    echo "📊 SENTIMENT SERVICE"
    echo "============================================"
    
    check_model_artifacts "sentiment" || exit 1
    build_and_push "sentiment" "$SENTIMENT_REPO" "8001"
    restart_ec2_service "sentiment"
fi

# Process relevance service
if [[ "$SERVICE" == "relevance" || "$SERVICE" == "both" ]]; then
    echo ""
    echo "============================================"
    echo "🎯 RELEVANCE SERVICE"
    echo "============================================"
    
    check_model_artifacts "relevance" || exit 1
    build_and_push "relevance" "$RELEVANCE_REPO" "8002"
    restart_ec2_service "relevance"
fi

# Final health checks
echo ""
echo "============================================"
echo "🏥 Final Health Checks"
echo "============================================"

cd "$SCRIPT_DIR/../infrastructure/terraform"
SENTIMENT_URL=$(terraform output -raw sentiment_service_url 2>/dev/null)
RELEVANCE_URL=$(terraform output -raw relevance_service_url 2>/dev/null)

if [[ "$SERVICE" == "sentiment" || "$SERVICE" == "both" ]]; then
    echo ""
    echo "Testing sentiment service..."
    sleep 5
    curl -s "$SENTIMENT_URL/health" || echo -e "${YELLOW}⚠️  Service may still be starting${NC}"
fi

if [[ "$SERVICE" == "relevance" || "$SERVICE" == "both" ]]; then
    echo ""
    echo "Testing relevance service..."
    sleep 5
    curl -s "$RELEVANCE_URL/health" || echo -e "${YELLOW}⚠️  Service may still be starting${NC}"
fi

echo ""
echo "============================================"
echo -e "${GREEN}✅ REDEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo "📊 Service URLs:"
[[ "$SERVICE" == "sentiment" || "$SERVICE" == "both" ]] && echo "   Sentiment: $SENTIMENT_URL"
[[ "$SERVICE" == "relevance" || "$SERVICE" == "both" ]] && echo "   Relevance: $RELEVANCE_URL"
echo ""
echo -e "${YELLOW}💡 Models may take 20-30 seconds to fully load${NC}"
echo "   Test with: curl <service_url>/health"
echo ""
