#!/bin/bash
# Common utilities for deployment pipeline

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
say_ok()    { echo -e "${GREEN}✅ $1${NC}"; }
say_err()   { echo -e "${RED}❌ $1${NC}"; }
say_warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
say_info()  { echo -e "${BLUE}ℹ️  $1${NC}"; }
say_step()  { echo -e "${CYAN}🔹 $1${NC}"; }
say_header(){ echo -e "${PURPLE}$1${NC}"; }

# Verbose logging
VERBOSE=${VERBOSE:-false}

log_verbose() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}[VERBOSE] $1${NC}"
  fi
}

# Execute command with optional verbose output
exec_cmd() {
  log_verbose "Running: $*"
  if [ "$VERBOSE" = true ]; then
    "$@"
  else
    "$@" >/dev/null 2>&1
  fi
}

# Execute command and show output on error
exec_cmd_show_on_error() {
  local cmd="$*"
  local output
  log_verbose "Running: $cmd"
  
  if [ "$VERBOSE" = true ]; then
    "$@"
  else
    output=$("$@" 2>&1)
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
      echo "$output"
      return $exit_code
    fi
  fi
}

# Check if command exists
require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    say_err "$1 not found. Install: $2"
    exit 1
  fi
}

# Get AWS account ID
get_account_id() {
  aws sts get-caller-identity --query Account --output text 2>/dev/null
}

# Check if ECR repository exists
ecr_repo_exists() {
  local repo_name=$1
  local region=${2:-us-east-1}
  aws ecr describe-repositories \
    --repository-names "$repo_name" \
    --region "$region" >/dev/null 2>&1
}

# Create ECR repository
create_ecr_repo() {
  local repo_name=$1
  local region=${2:-us-east-1}
  
  log_verbose "Creating ECR repository: $repo_name"
  aws ecr create-repository \
    --repository-name "$repo_name" \
    --image-scanning-configuration scanOnPush=true \
    --region "$region" >/dev/null
}

# ECR login
ecr_login() {
  local account_id=$1
  local region=${2:-us-east-1}
  
  log_verbose "Logging into ECR"
  aws ecr get-login-password --region "$region" \
    | docker login --username AWS --password-stdin "${account_id}.dkr.ecr.${region}.amazonaws.com" >/dev/null 2>&1
}

# Export functions for use in other scripts
export -f say_ok say_err say_warn say_info say_step say_header
export -f log_verbose exec_cmd exec_cmd_show_on_error
export -f require_cmd get_account_id ecr_repo_exists create_ecr_repo ecr_login
