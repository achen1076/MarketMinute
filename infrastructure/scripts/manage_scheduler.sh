#!/bin/bash
set -e

RULE_NAME="marketminute-dev-daily-analysis"
REGION="us-east-1"

case "${1:-}" in
  status)
    echo "📊 Scheduler Status:"
    aws events describe-rule --name "$RULE_NAME" --region "$REGION" --query '{Name:Name,State:State,Schedule:ScheduleExpression,Description:Description}' --output table
    echo ""
    echo "📅 Next 5 scheduled runs (approximate):"
    echo "   Monday-Friday at 4:05 PM EST (9:05 PM UTC)"
    ;;
  
  enable)
    echo "▶️  Enabling scheduler..."
    aws events enable-rule --name "$RULE_NAME" --region "$REGION"
    echo "✅ Scheduler enabled - Lambda will run every weekday at 4:05 PM EST"
    ;;
  
  disable)
    echo "⏸️  Disabling scheduler..."
    aws events disable-rule --name "$RULE_NAME" --region "$REGION"
    echo "✅ Scheduler disabled - Lambda will not run automatically"
    ;;
  
  test)
    echo "🧪 Triggering manual test run..."
    aws lambda invoke \
      --function-name "marketminute-dev-orchestrator" \
      --cli-binary-format raw-in-base64-out \
      --payload '{"task":"daily_analysis"}' \
      --region "$REGION" \
      /tmp/lambda-response.json
    echo ""
    echo "Response:"
    cat /tmp/lambda-response.json | jq '.body | fromjson' 2>/dev/null || cat /tmp/lambda-response.json
    rm /tmp/lambda-response.json
    ;;
  
  logs)
    echo "📋 Fetching recent Lambda logs..."
    aws logs tail /aws/lambda/marketminute-dev-orchestrator --since 1h --region "$REGION" --follow
    ;;
  
  *)
    echo "Usage: $0 {status|enable|disable|test|logs}"
    echo ""
    echo "Commands:"
    echo "  status   - Show scheduler status and schedule"
    echo "  enable   - Enable automatic daily runs"
    echo "  disable  - Disable automatic daily runs"
    echo "  test     - Manually trigger a test run"
    echo "  logs     - View Lambda execution logs"
    exit 1
    ;;
esac
