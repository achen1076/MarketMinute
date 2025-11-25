#!/bin/bash
# Terraform operations module

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

terraform_init() {
  local terraform_dir=$1
  
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say_header "PHASE 3: Terraform Initialization"
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo
  
  cd "$terraform_dir"
  
  say_step "Running terraform init..."
  if [ "$VERBOSE" = true ]; then
    terraform init -reconfigure
  else
    terraform init -reconfigure >/dev/null
  fi
  say_ok "Terraform initialized"
  echo
  
  return 0
}

terraform_plan() {
  local terraform_dir=$1
  local skip_plan=$2
  local destroy=$3
  
  if [ "$destroy" = true ] || [ "$skip_plan" = true ]; then
    return 0
  fi
  
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say_header "PHASE 4: Terraform Plan"
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo
  
  cd "$terraform_dir"
  
  say_step "Generating execution plan..."
  if terraform plan -out=tfplan; then
    say_ok "Plan generated successfully"
  else
    say_err "Plan failed! Review the errors above."
    exit 1
  fi
  echo
  
  return 0
}

terraform_apply() {
  local terraform_dir=$1
  local skip_plan=$2
  local auto_approve=$3
  
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say_header "PHASE 5: Terraform Apply"
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo
  
  cd "$terraform_dir"
  
  # Interactive approval if not auto-approve and plan exists
  if [ "$auto_approve" = false ] && [ "$skip_plan" = false ]; then
    say_warn "Review the plan above."
    read -p "Type 'yes' to apply: " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
      say_warn "Apply cancelled."
      rm -f tfplan
      exit 0
    fi
  fi
  
  say_step "Applying infrastructure changes..."
  
  if [ "$skip_plan" = false ]; then
    terraform apply tfplan
  else
    if [ "$auto_approve" = true ]; then
      terraform apply -auto-approve
    else
      terraform apply
    fi
  fi
  
  say_ok "Infrastructure deployed!"
  rm -f tfplan
  echo
  
  return 0
}

terraform_destroy() {
  local terraform_dir=$1
  local auto_approve=$2
  
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say_header "PHASE 5: Terraform Destroy"
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo
  
  cd "$terraform_dir"
  
  say_warn "⚠️  WARNING: This will DESTROY all infrastructure!"
  say_warn "Resources to be deleted:"
  say_warn "  • SageMaker endpoint (may take 5-10 minutes)"
  say_warn "  • Lambda function"
  say_warn "  • EventBridge rules"
  say_warn "  • IAM roles and policies"
  echo
  
  if [ "$auto_approve" = false ]; then
    read -p "Type 'destroy' to confirm: " CONFIRM
    if [ "$CONFIRM" != "destroy" ]; then
      say_warn "Destroy cancelled."
      exit 0
    fi
  fi
  
  say_step "Destroying infrastructure..."
  if terraform destroy -auto-approve; then
    say_ok "Infrastructure destroyed"
  else
    say_err "Destroy failed!"
    exit 1
  fi
  
  echo
  return 0
}

show_deployment_summary() {
  local terraform_dir=$1
  
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say_header "PHASE 6: Deployment Summary"
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo
  
  cd "$terraform_dir"
  
  say_step "Terraform Outputs:"
  terraform output
  echo
  
  # Get specific outputs for testing commands
  local lambda_url=$(terraform output -raw lambda_function_url 2>/dev/null || echo "")
  local sagemaker_endpoint=$(terraform output -raw sagemaker_endpoint_name 2>/dev/null || echo "")
  local eventbridge_schedule=$(terraform output -raw eventbridge_schedule 2>/dev/null || echo "")
  
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say_ok "🎉 Deployment Complete!"
  say_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo
  
  echo -e "${CYAN}📊 Deployed Resources:${NC}"
  echo "  • Lambda Function URL: ${lambda_url}"
  echo "  • SageMaker Endpoint:  ${sagemaker_endpoint}"
  echo "  • Cron Schedule:       ${eventbridge_schedule}"
  echo
  
  echo -e "${CYAN}🧪 Test Your Deployment:${NC}"
  echo
  echo "  # Test Lambda Function URL"
  echo "  curl -X POST '${lambda_url}' \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"task\":\"daily_analysis\"}'"
  echo
  
  echo -e "${CYAN}📝 Monitor Logs:${NC}"
  echo
  echo "  # Lambda logs"
  echo "  aws logs tail /aws/lambda/marketminute-dev-orchestrator --follow"
  echo
  echo "  # SageMaker logs"
  echo "  aws logs tail /aws/sagemaker/Endpoints/${sagemaker_endpoint} --follow"
  echo
  
  echo -e "${CYAN}🔧 Next Steps:${NC}"
  echo "  1. Test the Lambda endpoint (command above)"
  echo "  2. Upload Schwab token: ./scripts/upload_schwab_token.sh"
  echo "  3. Check your webapp admin panel for manual triggers"
  echo "  4. Monitor the scheduled cron job execution"
  echo
  
  say_ok "✨ Your infrastructure is live and ready!"
  echo
  
  return 0
}
