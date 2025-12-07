import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "model"

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
BATCH_SIZE = 256
MAX_ITERATIONS = 1000
C_PARAM = 1.0

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8001))
