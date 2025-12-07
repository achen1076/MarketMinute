from pathlib import Path
import sys
import os

# Get parent directory and add to path BEFORE importing config
parent_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(parent_dir))
os.chdir(parent_dir)

from config import *
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, mean_absolute_error
import numpy as np
import pandas as pd
import joblib


def to_classes(scores):
    """Convert continuous relevance scores [0,1] to 5 classes."""
    bins = np.linspace(0, 1, 6)
    classes = np.digitize(scores, bins) - 1
    return np.clip(classes, 0, 4)


def proba_to_score(probas):
    """Convert class probabilities to continuous relevance score."""
    class_values = np.array([0.0, 0.25, 0.5, 0.75, 1.0])
    return probas @ class_values


if __name__ == "__main__":
    # Load training data
    data_file = Path("data/relevance_train.csv")

    if not data_file.exists():
        print(f"ERROR: Training data not found at {data_file}")
        print("Please create training data with columns: headline, ticker, relevance")
        sys.exit(1)

    df = pd.read_csv(data_file)

    # Create combined text from headline and ticker
    df["text"] = df["headline"] + " | " + df["ticker"]

    # Split train/val
    train_df = df.sample(frac=0.9, random_state=42)
    val_df = df.drop(train_df.index)

    train_texts = train_df["text"].tolist()
    train_labels = train_df["relevance"].tolist()
    val_texts = val_df["text"].tolist()
    val_labels = val_df["relevance"].tolist()

    print(f"Train: {len(train_texts)}, Val: {len(val_texts)}")

    # Generate embeddings
    print(f"Loading embedding model: {EMBEDDING_MODEL}")
    embedder = SentenceTransformer(EMBEDDING_MODEL)

    print("Encoding training data...")
    train_emb = embedder.encode(
        train_texts, batch_size=BATCH_SIZE, show_progress_bar=True)

    print("Encoding validation data...")
    val_emb = embedder.encode(
        val_texts, batch_size=BATCH_SIZE, show_progress_bar=True)

    # Scale embeddings
    scaler = StandardScaler()
    train_emb_scaled = scaler.fit_transform(train_emb)
    val_emb_scaled = scaler.transform(val_emb)

    # Convert to classes
    train_classes = to_classes(train_labels)
    val_classes = to_classes(val_labels)

    # Train classifier
    print("Training classifier...")
    clf = LogisticRegression(
        max_iter=1000,
        C=1.0,
        class_weight='balanced',
        random_state=42
    )
    clf.fit(train_emb_scaled, train_classes)

    # Evaluate
    train_acc = accuracy_score(train_classes, clf.predict(train_emb_scaled))
    val_acc = accuracy_score(val_classes, clf.predict(val_emb_scaled))

    train_mae = mean_absolute_error(
        train_labels, proba_to_score(clf.predict_proba(train_emb_scaled)))
    val_mae = mean_absolute_error(
        val_labels, proba_to_score(clf.predict_proba(val_emb_scaled)))

    print(f"\nAccuracy: {train_acc:.3f} / {val_acc:.3f}")
    print(f"MAE: {train_mae:.3f} / {val_mae:.3f}")

    # Save model
    MODEL_DIR.mkdir(exist_ok=True)
    model_artifacts = {
        'classifier': clf,
        'scaler': scaler,
        'embedding_model': EMBEDDING_MODEL
    }
    joblib.dump(model_artifacts, MODEL_PATH)

    print(f"\nSaved to {MODEL_PATH}")
    print(f"Embedding model: {EMBEDDING_MODEL}")
    print("\nTo use the model, start the API server:")
    print("  uvicorn app:app --host 0.0.0.0 --port 8002")
