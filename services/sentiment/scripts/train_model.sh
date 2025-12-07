#!/bin/bash

echo "=========================================="
echo "🧠 Model Training Pipeline"
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if labeled data exists
if [ ! -f "../data/ticker_news_training_labeled.csv" ] && [ ! -f "../data/general_news_training_labeled.csv" ]; then
    echo "❌ Error: No labeled data found!"
    echo "   Run ./scripts/label_with_ai.sh first to label your training data"
    exit 1
fi

# Step 1: Prepare training data
echo ""
echo "📊 Step 1: Preparing training data..."
python3 prepare_training_data.py

if [ $? -ne 0 ]; then
    echo "❌ Failed to prepare training data"
    exit 1
fi

# Step 2: Train model
echo ""
echo "🧠 Step 2: Training model..."
cd ../training
python3 train.py

if [ $? -ne 0 ]; then
    echo "❌ Failed to train model"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Training pipeline complete!"
echo "=========================================="
