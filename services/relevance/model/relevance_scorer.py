from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import numpy as np
from pathlib import Path
import joblib


class RelevanceScorer:
    def __init__(self, model_path, embedding_model=None):
        artifacts = joblib.load(model_path)

        # Use embedding model from artifacts if available, otherwise use provided
        saved_embedding_model = artifacts.get('embedding_model')
        if saved_embedding_model:
            self.embedder = SentenceTransformer(saved_embedding_model)
            if embedding_model and embedding_model != saved_embedding_model:
                import warnings
                warnings.warn(
                    f"Model was trained with '{saved_embedding_model}' but '{embedding_model}' was provided. "
                    f"Using '{saved_embedding_model}' for consistency."
                )
        elif embedding_model:
            self.embedder = SentenceTransformer(embedding_model)
        else:
            raise ValueError(
                "No embedding model found in artifacts and none provided")

        self.classifier = artifacts['classifier']
        self.scaler = artifacts.get('scaler')
        self.class_values = np.array([0.0, 0.25, 0.5, 0.75, 1.0])

    def score(self, headline, ticker):
        """Score relevance of a headline to a ticker."""
        text = f"{headline} | {ticker}"
        embedding = self.embedder.encode([text], show_progress_bar=False)

        if self.scaler:
            embedding = self.scaler.transform(embedding)

        probas = self.classifier.predict_proba(embedding)[0]
        score = float(probas @ self.class_values)

        return {
            "score": score,
            "category": self.categorize(score)
        }

    def score_batch(self, headlines, tickers, batch_size):
        """Score multiple headline-ticker pairs."""
        texts = [f"{h} | {t}" for h, t in zip(headlines, tickers)]
        embeddings = self.embedder.encode(
            texts, batch_size=batch_size, show_progress_bar=False)

        if self.scaler:
            embeddings = self.scaler.transform(embeddings)

        probas = self.classifier.predict_proba(embeddings)
        scores = (probas @ self.class_values).tolist()

        return [
            {"score": s, "category": self.categorize(s)}
            for s in scores
        ]

    def categorize(self, score):
        """Categorize relevance score."""
        if score >= 0.8:
            return "highly_relevant"
        elif score >= 0.6:
            return "relevant"
        elif score >= 0.4:
            return "somewhat_relevant"
        elif score >= 0.2:
            return "marginally_relevant"
        else:
            return "not_relevant"
