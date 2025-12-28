#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_DIR="$(dirname "$SCRIPT_DIR")"
PLATFORM_DIR="$(dirname "$AGENT_DIR")"
MCP_DIR="$PLATFORM_DIR/mcp"

echo "Building Lambda bundle..."

# Install MCP dependencies (includes Prisma)
cd "$MCP_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing MCP dependencies..."
  npm install
fi

# Generate Prisma client (schema is in webapp)
echo "Generating Prisma client..."
npx prisma generate --schema="$PLATFORM_DIR/../webapp/prisma/schema.prisma"

cd "$AGENT_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing Agent dependencies..."
  npm install
fi

# Create dist directory
mkdir -p dist

# Bundle with esbuild
echo "Bundling with esbuild..."
npx esbuild \
  src/lambda/handler.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --outfile=dist/handler.js \
  --external:@prisma/client \
  --minify

# Copy Prisma client from webapp (where it was generated)
WEBAPP_DIR="$PLATFORM_DIR/../webapp"
echo "Copying Prisma client..."
cp -r "$WEBAPP_DIR/node_modules/.prisma" dist/prisma
cp -r "$WEBAPP_DIR/node_modules/@prisma" dist/@prisma

echo "Bundle created at dist/handler.js"
echo "Size: $(du -h dist/handler.js | cut -f1)"
echo "Prisma client copied to dist/"
