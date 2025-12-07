"""
Train sentiment analysis model on labeled financial news data
Uses FinBERT embeddings + Logistic Regression for fast, accurate predictions
"""

from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, mean_absolute_error, r2_score
import numpy as np
import pandas as pd
import joblib
import os
from pathlib import Path

# Configuration
# Fast, lightweight, compatible
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
BATCH_SIZE = 32
MAX_ITERATIONS = 1000
C_PARAM = 1.0
TEST_SIZE = 0.15
RANDOM_STATE = 42


def to_classes(scores):
    """Convert continuous sentiment scores to discrete classes"""
    bins = np.linspace(-1, 1, 6)
    classes = np.digitize(scores, bins) - 1
    return np.clip(classes, 0, 4)


def proba_to_score(probas):
    """Convert class probabilities back to sentiment scores"""
    class_values = np.array([-1.0, -0.5, 0.0, 0.5, 1.0])
    return probas @ class_values


def main():
    print("=" * 60)
    print("🧠 Training Sentiment Analysis Model")
    print("=" * 60)

    # Load data
    data_file = "../data/combined_training_data.csv"
    if not os.path.exists(data_file):
        print(f"❌ Error: {data_file} not found!")
        print("   Run: python ../scripts/prepare_training_data.py first")
        return

    print(f"\n📦 Loading training data from {data_file}...")
    df = pd.read_csv(data_file)
    print(f"   Loaded {len(df)} records")

    # Split into train/val
    train_df = df.sample(frac=(1 - TEST_SIZE), random_state=RANDOM_STATE)
    val_df = df.drop(train_df.index)

    train_texts = train_df["text"].tolist()
    train_labels = train_df["sentiment"].tolist()
    val_texts = val_df["text"].tolist()
    val_labels = val_df["sentiment"].tolist()

    print(f"   Train: {len(train_texts)} samples")
    print(f"   Val: {len(val_texts)} samples")

    # Load embedder
    print(f"\n🤖 Loading embedding model: {EMBEDDING_MODEL}...")
    embedder = SentenceTransformer(EMBEDDING_MODEL)

    # Generate embeddings
    print(f"\n📊 Generating embeddings...")
    train_emb = embedder.encode(
        train_texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        convert_to_numpy=True
    )
    val_emb = embedder.encode(
        val_texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        convert_to_numpy=True
    )

    # Scale embeddings
    print(f"\n⚖️  Scaling features...")
    scaler = StandardScaler()
    train_emb_scaled = scaler.fit_transform(train_emb)
    val_emb_scaled = scaler.transform(val_emb)

    # Convert to classes for classification
    train_classes = to_classes(train_labels)
    val_classes = to_classes(val_labels)

    # Train classifier
    print(f"\n🎯 Training Logistic Regression...")
    clf = LogisticRegression(
        max_iter=MAX_ITERATIONS,
        C=C_PARAM,
        class_weight='balanced',
        random_state=RANDOM_STATE,
        verbose=1
    )
    clf.fit(train_emb_scaled, train_classes)

    # Evaluate
    print(f"\n📈 Evaluating model...")

    # Class accuracy
    train_acc = accuracy_score(train_classes, clf.predict(train_emb_scaled))
    val_acc = accuracy_score(val_classes, clf.predict(val_emb_scaled))

    # Regression metrics (convert back to continuous scores)
    train_pred_scores = proba_to_score(clf.predict_proba(train_emb_scaled))
    val_pred_scores = proba_to_score(clf.predict_proba(val_emb_scaled))

    train_mae = mean_absolute_error(train_labels, train_pred_scores)
    val_mae = mean_absolute_error(val_labels, val_pred_scores)

    train_r2 = r2_score(train_labels, train_pred_scores)
    val_r2 = r2_score(val_labels, val_pred_scores)

    print(f"\n✅ Results:")
    print(f"   Classification Accuracy:")
    print(f"      Train: {train_acc:.3f}")
    print(f"      Val:   {val_acc:.3f}")
    print(f"\n   Mean Absolute Error (sentiment):")
    print(f"      Train: {train_mae:.3f}")
    print(f"      Val:   {val_mae:.3f}")
    print(f"\n   R² Score:")
    print(f"      Train: {train_r2:.3f}")
    print(f"      Val:   {val_r2:.3f}")

    # Save model
    model_dir = Path("../model")
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / "sentiment_classifier.pkl"

    print(f"\n💾 Saving model to {model_path}...")
    joblib.dump({
        'classifier': clf,
        'scaler': scaler,
        'embedder_name': EMBEDDING_MODEL
    }, model_path)

    # Save training stats
    stats = {
        'train_samples': len(train_texts),
        'val_samples': len(val_texts),
        'train_acc': train_acc,
        'val_acc': val_acc,
        'train_mae': train_mae,
        'val_mae': val_mae,
        'train_r2': train_r2,
        'val_r2': val_r2
    }

    stats_path = model_dir / "training_stats.json"
    import json
    with open(stats_path, 'w') as f:
        json.dump(stats, f, indent=2)

    print(f"   Saved training stats to {stats_path}")

    print(f"\n{'=' * 60}")
    print("✅ Training Complete!")
    print(f"{'=' * 60}")
    print(f"\n📝 Model Files:")
    print(f"   - {model_path}")
    print(f"   - {stats_path}")
    print(f"\n🚀 Next Steps:")
    print(f"   1. Test the model on new headlines")
    print(f"   2. Deploy to production API")
    print(f"   3. Monitor performance and retrain as needed")


if __name__ == "__main__":
    main()
