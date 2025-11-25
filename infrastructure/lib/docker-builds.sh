#!/bin/bash
# Docker build module

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Build staging directory (outside repo)
BUILD_STAGING="${BUILD_STAGING:-/tmp/marketminute-build}"

build_sagemaker_container() {
  local account_id=$1
  local region=$2
  local quant_dir=$3
  
  say_step "Building SageMaker container..."
  echo
  
  local repo_name="marketminute-sagemaker"
  local image_uri="${account_id}.dkr.ecr.${region}.amazonaws.com/${repo_name}:latest"
  
  # Ensure ECR repo
  say_info "Checking ECR repository: ${repo_name}"
  if ! ecr_repo_exists "$repo_name" "$region"; then
    say_warn "Creating ECR repository..."
    create_ecr_repo "$repo_name" "$region"
    say_ok "Repository created"
  else
    say_ok "Repository exists"
  fi
  
  # ECR login
  say_info "Logging into ECR..."
  ecr_login "$account_id" "$region"
  say_ok "ECR login successful"
  
  # Create staging directory
  local staging="${BUILD_STAGING}/sagemaker"
  rm -rf "$staging"
  mkdir -p "$staging"
  log_verbose "Build staging: $staging"
  
  # Copy files to staging
  say_info "Preparing build context in staging directory..."
  cp -r "${quant_dir}/sagemaker"/* "$staging/"
  cp -r "${quant_dir}/models/lgbm" "$staging/models"
  cp -r "${quant_dir}/src" "$staging/src"
  say_ok "Build context prepared"
  
  # Build
  say_info "Building Docker image (this may take a few minutes)..."
  cd "$staging"
  
  if [ "$VERBOSE" = true ]; then
    docker build \
      --platform linux/amd64 \
      --provenance=false \
      -t "${repo_name}:latest" \
      .
  else
    docker build \
      --platform linux/amd64 \
      --provenance=false \
      -t "${repo_name}:latest" \
      . >/dev/null 2>&1
  fi
  
  say_ok "Image built"
  
  # Tag & Push
  say_info "Pushing to ECR..."
  docker tag "${repo_name}:latest" "$image_uri"
  
  if [ "$VERBOSE" = true ]; then
    docker push "$image_uri"
  else
    docker push "$image_uri" >/dev/null 2>&1
  fi
  
  say_ok "Pushed: ${image_uri}"
  
  # Cleanup staging
  log_verbose "Cleaning up staging directory"
  rm -rf "$staging"
  
  echo
  say_ok "SageMaker container ready!"
  echo
  
  return 0
}

build_lambda_container() {
  local account_id=$1
  local region=$2
  local quant_dir=$3
  
  say_step "Building Lambda container..."
  echo
  
  local repo_name="marketminute-lambda"
  local image_uri="${account_id}.dkr.ecr.${region}.amazonaws.com/${repo_name}:latest"
  
  # Ensure ECR repo
  say_info "Checking ECR repository: ${repo_name}"
  if ! ecr_repo_exists "$repo_name" "$region"; then
    say_warn "Creating ECR repository..."
    create_ecr_repo "$repo_name" "$region"
    say_ok "Repository created"
  else
    say_ok "Repository exists"
  fi
  
  # ECR login
  say_info "Logging into ECR..."
  ecr_login "$account_id" "$region"
  say_ok "ECR login successful"
  
  # Create staging directory
  local staging="${BUILD_STAGING}/lambda"
  rm -rf "$staging"
  mkdir -p "$staging"
  log_verbose "Build staging: $staging"
  
  # Copy files to staging
  say_info "Preparing build context in staging directory..."
  cp -r "${quant_dir}/lambda"/* "$staging/"
  cp -r "${quant_dir}/src" "$staging/src"
  say_ok "Build context prepared"
  
  # Build
  say_info "Building Docker image..."
  cd "$staging"
  
  if [ "$VERBOSE" = true ]; then
    docker build \
      --platform linux/amd64 \
      -t "${repo_name}:latest" \
      .
  else
    docker build \
      --platform linux/amd64 \
      -t "${repo_name}:latest" \
      . >/dev/null 2>&1
  fi
  
  say_ok "Image built"
  
  # Tag & Push
  say_info "Pushing to ECR..."
  docker tag "${repo_name}:latest" "$image_uri"
  
  if [ "$VERBOSE" = true ]; then
    docker push "$image_uri"
  else
    docker push "$image_uri" >/dev/null 2>&1
  fi
  
  say_ok "Pushed: ${image_uri}"
  
  # Cleanup staging
  log_verbose "Cleaning up staging directory"
  rm -rf "$staging"
  
  echo
  say_ok "Lambda container ready!"
  echo
  
  return 0
}

build_docker_images() {
  local skip_docker=$1
  local skip_sagemaker=$2
  local skip_lambda=$3
  local account_id=$4
  local region=$5
  local quant_dir=$6
  
  if [ "$skip_docker" = true ]; then
    say_warn "Skipping all Docker builds (--skip-docker)"
    echo
    return 0
  fi
  
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say_header "PHASE 2: Docker Image Builds"
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo
  
  say_info "Build staging directory: ${BUILD_STAGING}"
  mkdir -p "$BUILD_STAGING"
  echo
  
  # Build SageMaker
  if [ "$skip_sagemaker" = false ]; then
    build_sagemaker_container "$account_id" "$region" "$quant_dir"
  else
    say_warn "Skipping SageMaker build (--skip-sagemaker)"
    echo
  fi
  
  # Build Lambda
  if [ "$skip_lambda" = false ]; then
    build_lambda_container "$account_id" "$region" "$quant_dir"
  else
    say_warn "Skipping Lambda build (--skip-lambda)"
    echo
  fi
  
  say_ok "All Docker images built and pushed!"
  echo
  
  return 0
}
