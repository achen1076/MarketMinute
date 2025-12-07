#!/bin/bash

# Daily Training Data Collection Runner
# This script sets up the environment and runs the training data collection

set -e

echo "=========================================="
echo "Training Data Collection"
echo "=========================================="

# Change to script directory
cd "$(dirname "$0")"

# Check for required environment variables
if [ -z "$FMP_API_KEY" ]; then
    echo "❌ Error: FMP_API_KEY environment variable not set"
    echo "   Please set it: export FMP_API_KEY='your_key'"
    exit 1
fi

# Set default WEBAPP_URL if not set
if [ -z "$WEBAPP_URL" ]; then
    export WEBAPP_URL="http://localhost:3000"
    echo "ℹ️  Using default WEBAPP_URL: $WEBAPP_URL"
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
python3 -c "import requests" 2>/dev/null || pip install requests

# Run the collection script
echo "🚀 Starting training data collection..."
python3 collect_training_data.py

echo "✅ Complete!"
