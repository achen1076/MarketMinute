#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_DIR="$(dirname "$SCRIPT_DIR")"
PLATFORM_DIR="$(dirname "$AGENT_DIR")"
MCP_DIR="$PLATFORM_DIR/mcp"
WEBAPP_DIR="$PLATFORM_DIR/../webapp"

# Config
ECR_REPO="767397974418.dkr.ecr.us-east-1.amazonaws.com/marketminute-agent"
LAMBDA_NAME="marketminute-dev-agent"
AWS_REGION="us-east-1"

echo "=== MarketMinute Agent Lambda Deploy ==="

# Clean dist
echo "[1/6] Cleaning dist..."
rm -rf "$AGENT_DIR/dist"
mkdir -p "$AGENT_DIR/dist"

# Install dependencies if needed
cd "$MCP_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing MCP dependencies..."
  npm install
fi

cd "$AGENT_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing Agent dependencies..."
  npm install
fi

# Generate Prisma client
echo "[2/6] Generating Prisma client..."
cd "$MCP_DIR"
npx prisma generate --schema="$WEBAPP_DIR/prisma/schema.prisma"

# Bundle with esbuild
echo "[3/6] Bundling with esbuild..."
cd "$AGENT_DIR"
npx esbuild \
  src/lambda/handler.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --outfile=dist/handler.js \
  --external:@prisma/client \
  --minify

# Copy Prisma client
echo "Copying Prisma client..."
cp -r "$WEBAPP_DIR/node_modules/.prisma" dist/prisma
cp -r "$WEBAPP_DIR/node_modules/@prisma" dist/@prisma

echo "Bundle size: $(du -h dist/handler.js | cut -f1)"

# Build Docker image
echo "[4/6] Building Docker image..."
docker build --platform linux/amd64 --provenance=false -t marketminute-agent:latest "$AGENT_DIR"

# Push to ECR
echo "[5/6] Pushing to ECR..."
docker tag marketminute-agent:latest "$ECR_REPO:latest"
docker push "$ECR_REPO:latest"

# Update Lambda
echo "[6/6] Updating Lambda function..."
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --image-uri "$ECR_REPO:latest" \
  --region "$AWS_REGION" \
  --query 'LastModified' \
  --output text

echo ""
echo "=== Deploy complete! ==="
echo "Lambda: $LAMBDA_NAME"
echo "Image: $ECR_REPO:latest"
