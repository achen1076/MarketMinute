import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "model"

# Model configuration
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
MODEL_PATH = MODEL_DIR / "relevance_classifier.pkl"
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8002))

# Relevance thresholds
DEFAULT_THRESHOLD = 0.5
HIGH_RELEVANCE_THRESHOLD = 0.8
