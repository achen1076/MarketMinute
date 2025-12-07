from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from contextlib import asynccontextmanager
import logging

from model.sentiment_classifier import SentimentScorer
from config import EMBEDDING_MODEL, MODEL_DIR, BATCH_SIZE, HOST, PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scorer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global scorer
    model_path = MODEL_DIR / "sentiment_classifier.pkl"
    scorer = SentimentScorer(model_path=model_path,
                             embedding_model=EMBEDDING_MODEL)
    logger.info(f"Sentiment scorer initialized with {EMBEDDING_MODEL}")
    yield
    # Shutdown (if needed)
    logger.info("Shutting down sentiment service")


app = FastAPI(title="Sentiment Scoring API",
              version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


class SentimentRequest(BaseModel):
    text: str = Field(..., description="Text to analyze for sentiment")


class SentimentBatchRequest(BaseModel):
    texts: List[str] = Field(..., description="List of texts to analyze")


class SentimentResponse(BaseModel):
    score: float = Field(..., description="Sentiment score (-1.0 to 1.0)")
    category: str = Field(..., description="Sentiment category")


class SentimentBatchResponse(BaseModel):
    scores: List[float] = Field(..., description="Sentiment scores")
    categories: List[str] = Field(..., description="Sentiment categories")


@app.get("/")
async def root():
    return {"service": "sentiment", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "embedding_model": EMBEDDING_MODEL}


@app.post("/score", response_model=SentimentResponse)
async def score_sentiment(request: SentimentRequest):
    """
    Score sentiment of a text.

    Returns a score in [-1.0, 1.0] where -1.0 is very negative and 1.0 is very positive.
    """
    try:
        score = scorer.score(request.text)
        category = scorer.categorize(score)
        return SentimentResponse(score=score, category=category)
    except Exception as e:
        logger.error(f"Error scoring sentiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score/batch", response_model=SentimentBatchResponse)
async def score_sentiment_batch(request: SentimentBatchRequest):
    """
    Score sentiment of multiple texts in a batch.
    """
    try:
        scores = scorer.score_batch(request.texts, batch_size=BATCH_SIZE)
        categories = [scorer.categorize(s) for s in scores]
        return SentimentBatchResponse(scores=scores, categories=categories)
    except Exception as e:
        logger.error(f"Error scoring sentiment batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=HOST, port=PORT, reload=True)
