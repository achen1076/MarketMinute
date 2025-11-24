#!/bin/bash

# Easy teardown script for MarketMinute AWS infrastructure
# This script safely destroys all AWS resources created by Terraform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"

echo "🗑️  MarketMinute Infrastructure Teardown"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if terraform directory exists
if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: Terraform directory not found at $TERRAFORM_DIR"
    exit 1
fi

cd "$TERRAFORM_DIR"

# Check if Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo "⚠️  Terraform not initialized. Initializing..."
    terraform init
fi

echo "📋 Current resources that will be destroyed:"
echo ""
terraform state list 2>/dev/null || echo "No resources found"
echo ""

# Confirmation prompt
read -p "⚠️  Are you sure you want to destroy ALL resources? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Teardown cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting teardown..."
echo ""

# Run terraform destroy
terraform destroy -auto-approve

echo ""
echo "✅ Teardown complete!"
echo ""
echo "📊 Resources destroyed:"
echo "   - Lambda function"
echo "   - API Gateway"
echo "   - IAM roles and policies"
echo "   - CloudWatch log groups"
echo "   - Function URLs"
echo ""
echo "💰 Cost impact: $0/month (all resources deleted)"
echo ""
echo "📝 Note: If you used Lambda Layers or ECR images, clean those up separately:"
echo "   aws lambda list-layers"
echo "   aws ecr list-images --repository-name marketminute-quant"
echo ""
