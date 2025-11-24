#!/bin/bash
set -e

REGION="us-east-1"
LOG_GROUP="/aws/lambda/marketminute-dev-orchestrator"

echo "📊 Recent Cron Job Executions"
echo "=============================="
echo ""

# Get recent invocations
aws logs filter-log-events \
  --log-group-name "$LOG_GROUP" \
  --filter-pattern "[Lambda] Starting analysis" \
  --region "$REGION" \
  --max-items 10 \
  --query 'events[*].[timestamp, message]' \
  --output text | while read timestamp message; do
    date_time=$(date -r $((timestamp/1000)) "+%Y-%m-%d %H:%M:%S")
    echo "🕐 $date_time - $message"
done

echo ""
echo "=============================="
echo "💡 For live monitoring, run:"
echo "   ./manage_scheduler.sh logs"
