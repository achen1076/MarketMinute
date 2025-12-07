from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
import logging

from model.relevance_scorer import RelevanceScorer
from config import EMBEDDING_MODEL, MODEL_PATH, BATCH_SIZE, HOST, PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scorer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global scorer
    scorer = RelevanceScorer(model_path=MODEL_PATH,
                             embedding_model=EMBEDDING_MODEL)
    logger.info("Relevance scorer initialized")
    yield
    # Shutdown (if needed)
    logger.info("Shutting down relevance service")


app = FastAPI(title="Relevance Scoring API",
              version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


class RelevanceRequest(BaseModel):
    headline: str = Field(..., description="News headline to score")
    ticker: str = Field(...,
                        description="Stock ticker symbol (e.g., 'AAPL', 'TSLA')")


class RelevanceResponse(BaseModel):
    score: float = Field(..., description="Relevance score (0.0-1.0)")
    category: str = Field(..., description="Relevance category")


@app.get("/")
async def root():
    return {"service": "relevance", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "embedding_model": EMBEDDING_MODEL}


@app.post("/score", response_model=RelevanceResponse)
async def score_relevance(request: RelevanceRequest):
    """
    Score how relevant a news headline is to a stock ticker.

    Returns a score in [0.0, 1.0] where 1.0 is highly relevant.
    """
    try:
        result = scorer.score(request.headline, request.ticker)
        return RelevanceResponse(score=result["score"], category=result["category"])
    except Exception as e:
        logger.error(f"Error scoring relevance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=HOST, port=PORT, reload=True)
