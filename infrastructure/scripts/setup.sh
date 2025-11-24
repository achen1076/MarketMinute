#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/../terraform"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

say_ok()  { echo -e "${GREEN}✅ $1${NC}"; }
say_err() { echo -e "${RED}❌ $1${NC}"; }
say_warn(){ echo -e "${YELLOW}⚠️  $1${NC}"; }
say_info(){ echo -e "${BLUE}ℹ️  $1${NC}"; }

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 MarketMinute SageMaker (Serverless) Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 1) sanity: aws + terraform
if ! command -v aws >/dev/null 2>&1; then
  say_err "AWS CLI not found (brew install awscli)"
  exit 1
fi
say_ok "AWS CLI present"

if ! command -v terraform >/dev/null 2>&1; then
  say_err "Terraform not found (brew install hashicorp/tap/terraform)"
  exit 1
fi
say_ok "Terraform present"

# 2) check creds
say_info "Checking AWS credentials..."
if aws sts get-caller-identity >/dev/null 2>&1; then
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  ARN=$(aws sts get-caller-identity --query Arn --output text)
  say_ok "Using AWS account: ${ACCOUNT_ID}"
  echo "   ARN: ${ARN}"
else
  say_err "AWS credentials not configured (run 'aws configure')"
  exit 1
fi
echo

# 3) ensure terraform.tfvars
cd "${TERRAFORM_DIR}"

if [ ! -f "terraform.tfvars" ]; then
  if [ -f "terraform.tfvars.example" ]; then
    say_warn "terraform.tfvars not found – creating from example"
    cp terraform.tfvars.example terraform.tfvars
    say_warn "Edit terraform.tfvars and set sagemaker_image_uri to your ECR image."
    exit 1
  else
    say_err "Missing terraform.tfvars and terraform.tfvars.example"
    exit 1
  fi
else
  say_ok "terraform.tfvars found"
fi
echo

# 4) terraform init
say_info "Running terraform init (reconfigure)..."
terraform init -reconfigure
say_ok "Terraform initialized"
echo

# 5) plan
say_info "Running terraform plan..."
if terraform plan -out=tfplan; then
  say_ok "Plan succeeded"
else
  say_err "Plan failed"
  exit 1
fi
echo

# 6) apply
say_warn "This will create/modify SageMaker resources (serverless endpoint)."
read -p "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  say_warn "Cancelled."
  rm -f tfplan
  exit 0
fi

say_info "Applying terraform..."
if terraform apply tfplan; then
  say_ok "Terraform apply complete"
else
  say_err "Terraform apply failed"
  rm -f tfplan
  exit 1
fi
rm -f tfplan
echo

# 7) show outputs
say_info "SageMaker deployment summary:"
terraform output

echo
say_ok "Setup complete."
echo
