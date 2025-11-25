#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# MarketMinute Infrastructure Pipeline
# ═══════════════════════════════════════════════════════════════════════════
# Complete end-to-end deployment pipeline for AWS infrastructure
# Handles: Prerequisites → Docker Builds → Terraform → Validation
#
# Features:
# • Modular architecture with reusable libraries
# • Build staging outside repo (/tmp)
# • Concurrent deployment lock
# • Verbose mode for debugging
# • OIDC support for CI/CD
# ═══════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════
# Configuration & Lock File
# ═══════════════════════════════════════════════════════════════════════════

LOCKFILE="/tmp/marketminute-deploy.lock"

# Acquire exclusive lock to prevent concurrent deployments
exec 9>"$LOCKFILE" || {
  echo "❌ Failed to create lock file"
  exit 1
}

if ! flock -n 9; then
  echo "❌ Deploy script is already running!"
  echo "   If you're sure no other deployment is in progress, remove: $LOCKFILE"
  exit 1
fi

# Cleanup lock on exit
trap 'rm -f "$LOCKFILE"' EXIT

# ═══════════════════════════════════════════════════════════════════════════
# Directory Setup
# ═══════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/terraform"
QUANT_DIR="${PROJECT_ROOT}/quant"
LIB_DIR="${SCRIPT_DIR}/lib"

# Load modules
source "${LIB_DIR}/common.sh"
source "${LIB_DIR}/prerequisites.sh"
source "${LIB_DIR}/docker-builds.sh"
source "${LIB_DIR}/terraform.sh"

# ═══════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════

AWS_REGION="us-east-1"
BUILD_STAGING="${BUILD_STAGING:-/tmp/marketminute-build}"

# Parse arguments
SKIP_DOCKER=false
SKIP_SAGEMAKER=false
SKIP_LAMBDA=false
SKIP_PLAN=false
AUTO_APPROVE=false
DESTROY=false
VERBOSE=false

show_help() {
  cat << EOF
MarketMinute Infrastructure Pipeline

USAGE:
  ./deploy-pipeline.sh [OPTIONS]

OPTIONS:
  --skip-docker        Skip all Docker builds (SageMaker + Lambda)
  --skip-sagemaker     Skip SageMaker Docker build only
  --skip-lambda        Skip Lambda Docker build only
  --skip-plan          Skip terraform plan (not recommended)
  --auto-approve       Auto-approve terraform apply (use with caution)
  --destroy            Run terraform destroy instead of apply
  --verbose            Show detailed output from all commands (debugging)
  --help               Show this help message

EXAMPLES:
  # Full deployment with interactive approval
  ./deploy-pipeline.sh

  # Quick config-only update (skip Docker builds)
  ./deploy-pipeline.sh --skip-docker

  # Full automated deployment
  ./deploy-pipeline.sh --auto-approve

  # Verbose mode for debugging
  ./deploy-pipeline.sh --verbose

  # Tear down infrastructure
  ./deploy-pipeline.sh --destroy

WORKFLOW:
  1. ✓ Acquire deployment lock (prevent concurrent runs)
  2. ✓ Check prerequisites (AWS CLI, Terraform, Docker)
  3. ✓ Validate AWS credentials
  4. ✓ Build & push SageMaker container to ECR (in /tmp staging)
  5. ✓ Build & push Lambda container to ECR (in /tmp staging)
  6. ✓ Initialize Terraform
  7. ✓ Plan infrastructure changes
  8. ✓ Apply changes (with approval)
  9. ✓ Display outputs and test commands

FEATURES:
  • Concurrent deployment protection via lock file
  • Build staging in /tmp (keeps repo clean)
  • Verbose mode for debugging (set -x style logging)
  • Modular architecture for maintainability
  • OIDC support for CI/CD (no AWS keys needed)

CI/CD INTEGRATION:
  For GitHub Actions, enable OIDC in terraform.tfvars:
    enable_github_oidc = true
    github_repo       = "your-org/your-repo"
  
  Then use in GitHub Actions workflow:
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: \${{ secrets.AWS_ROLE_ARN }}
        aws-region: us-east-1

EOF
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-docker)     SKIP_DOCKER=true; shift ;;
    --skip-sagemaker)  SKIP_SAGEMAKER=true; shift ;;
    --skip-lambda)     SKIP_LAMBDA=true; shift ;;
    --skip-plan)       SKIP_PLAN=true; shift ;;
    --auto-approve)    AUTO_APPROVE=true; shift ;;
    --destroy)         DESTROY=true; shift ;;
    --verbose)         VERBOSE=true; shift ;;
    --help)            show_help; exit 0 ;;
    *)                 say_err "Unknown option: $1"; show_help; exit 1 ;;
  esac
done

# Enable verbose mode
if [ "$VERBOSE" = true ]; then
  set -x
  export VERBOSE=true
fi

# ═══════════════════════════════════════════════════════════════════════════
# Main Execution
# ═══════════════════════════════════════════════════════════════════════════

# Header
clear
echo
say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
say_header "   🚀 MarketMinute Infrastructure Pipeline"
say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
say_info "Project Root:      ${PROJECT_ROOT}"
say_info "Terraform:         ${TERRAFORM_DIR}"
say_info "Build Staging:     ${BUILD_STAGING}"
say_info "Region:            ${AWS_REGION}"
say_info "Verbose Mode:      ${VERBOSE}"
say_info "Lock File:         ${LOCKFILE}"
echo

# Phase 1: Prerequisites
check_prerequisites "$SKIP_DOCKER" "$TERRAFORM_DIR"

# Get AWS account ID for Docker builds
ACCOUNT_ID=$(get_account_id)

# Phase 2: Docker Builds
if [ "$SKIP_DOCKER" = false ]; then
  build_docker_images \
    "$SKIP_DOCKER" \
    "$SKIP_SAGEMAKER" \
    "$SKIP_LAMBDA" \
    "$ACCOUNT_ID" \
    "$AWS_REGION" \
    "$QUANT_DIR"
fi

# Phase 3: Terraform Init
terraform_init "$TERRAFORM_DIR"

# Phase 4: Terraform Plan (if not destroying)
if [ "$DESTROY" = false ]; then
  terraform_plan "$TERRAFORM_DIR" "$SKIP_PLAN" "$DESTROY"
fi

# Phase 5: Terraform Apply or Destroy
if [ "$DESTROY" = true ]; then
  terraform_destroy "$TERRAFORM_DIR" "$AUTO_APPROVE"
else
  terraform_apply "$TERRAFORM_DIR" "$SKIP_PLAN" "$AUTO_APPROVE"
fi

# Phase 6: Summary (if not destroying)
if [ "$DESTROY" = false ]; then
  show_deployment_summary "$TERRAFORM_DIR"
fi

cd "$PROJECT_ROOT"

# Lock will be automatically released by trap
