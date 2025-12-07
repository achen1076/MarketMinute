#!/bin/bash

# Auto-label sentiment scores using GPT-4
# This combines GPT headline analysis with actual stock movements

set -e

echo "=========================================="
echo "🤖 AI Sentiment Labeling"
echo "=========================================="

# Change to script directory
cd "$(dirname "$0")"

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable not set"
    echo "   Please set it: export OPENAI_API_KEY='your_key'"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
pip install openai tqdm pandas numpy --quiet 2>/dev/null || true

# Run the labeling script
echo "🚀 Starting AI sentiment labeling..."
echo ""
python3 auto_label_sentiment.py

echo ""
echo "✅ Complete!"
