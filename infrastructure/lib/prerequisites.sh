#!/bin/bash
# Prerequisites validation module

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

check_prerequisites() {
  local skip_docker=$1
  local terraform_dir=$2
  
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say_header "PHASE 1: Prerequisites Check"
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo

  # Check AWS CLI
  say_step "Checking AWS CLI..."
  require_cmd aws "brew install awscli"
  local aws_version=$(aws --version | cut -d' ' -f1)
  say_ok "AWS CLI installed ($aws_version)"

  # Check Terraform
  say_step "Checking Terraform..."
  require_cmd terraform "brew install hashicorp/tap/terraform"
  local tf_version=$(terraform version | head -n1)
  say_ok "Terraform installed ($tf_version)"

  # Check Docker (if needed)
  if [ "$skip_docker" = false ]; then
    say_step "Checking Docker..."
    require_cmd docker "https://www.docker.com/products/docker-desktop"
    
    if ! docker info >/dev/null 2>&1; then
      say_err "Docker daemon not running. Start Docker Desktop."
      exit 1
    fi
    
    local docker_version=$(docker --version | cut -d' ' -f3 | tr -d ',')
    say_ok "Docker running ($docker_version)"
  fi

  # Validate AWS credentials
  say_step "Validating AWS credentials..."
  if ! aws sts get-caller-identity >/dev/null 2>&1; then
    say_err "AWS credentials not configured."
    say_info "Options:"
    say_info "  1. Local development: aws configure"
    say_info "  2. CI/CD: Use OIDC (see infrastructure/terraform/github-oidc.tf)"
    exit 1
  fi
  
  local account_id=$(get_account_id)
  local aws_user=$(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)
  say_ok "Authenticated as: ${aws_user}"
  say_ok "Account ID: ${account_id}"

  # Check terraform.tfvars
  say_step "Checking terraform.tfvars..."
  cd "$terraform_dir"
  
  if [ ! -f "terraform.tfvars" ]; then
    say_err "terraform.tfvars not found!"
    
    if [ -f "terraform.tfvars.example" ]; then
      say_warn "Creating from terraform.tfvars.example..."
      cp terraform.tfvars.example terraform.tfvars
      say_warn "Please edit terraform.tfvars before proceeding."
      exit 1
    else
      say_err "No terraform.tfvars or example found."
      exit 1
    fi
  fi
  
  say_ok "terraform.tfvars exists"

  echo
  say_ok "All prerequisites satisfied!"
  echo
  
  return 0
}
