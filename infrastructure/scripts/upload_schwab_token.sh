#!/bin/bash
set -e

# Upload Schwab OAuth token to AWS Secrets Manager
# This script reads your local schwab_token.json and stores it in Secrets Manager

AWS_REGION="us-east-1"
PROJECT_NAME="marketminute"
ENVIRONMENT="dev"
SECRET_NAME="${PROJECT_NAME}-${ENVIRONMENT}-schwab-token"
TOKEN_FILE="../../quant/schwab_token.json"

echo "🔐 Uploading Schwab token to AWS Secrets Manager"
echo "Secret name: $SECRET_NAME"
echo

# Check if token file exists
if [ ! -f "$TOKEN_FILE" ]; then
    echo "❌ Error: Token file not found at $TOKEN_FILE"
    echo "Please make sure you have a valid schwab_token.json file"
    exit 1
fi

# Read token file
TOKEN_CONTENT=$(cat "$TOKEN_FILE")

# Upload to Secrets Manager
echo "⬆️  Uploading token..."
aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string "$TOKEN_CONTENT" \
    --region "$AWS_REGION"

echo
echo "✅ Token uploaded successfully!"
echo
echo "Lambda will now use this token to fetch real market data from Schwab API"
echo
