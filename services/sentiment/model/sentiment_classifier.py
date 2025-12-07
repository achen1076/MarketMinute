from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import numpy as np
from pathlib import Path
import joblib


class SentimentScorer:
    def __init__(self, model_path, embedding_model):
        self.embedder = SentenceTransformer(embedding_model)

        artifacts = joblib.load(model_path)
        self.classifier = artifacts['classifier']
        self.scaler = artifacts.get('scaler')
        self.class_values = np.array([-1.0, -0.5, 0.0, 0.5, 1.0])

    def score(self, text):
        embedding = self.embedder.encode([text], show_progress_bar=False)
        if self.scaler:
            embedding = self.scaler.transform(embedding)
        probas = self.classifier.predict_proba(embedding)[0]
        return float(probas @ self.class_values)

    def score_batch(self, texts, batch_size):
        embeddings = self.embedder.encode(
            texts, batch_size=batch_size, show_progress_bar=False)
        if self.scaler:
            embeddings = self.scaler.transform(embeddings)
        probas = self.classifier.predict_proba(embeddings)
        return (probas @ self.class_values).tolist()

    def categorize(self, score):
        if score < -0.3:
            return "very_negative"
        if score < -0.05:
            return "negative"
        if score < 0.05:
            return "neutral"
        if score < 0.3:
            return "positive"
        return "very_positive"
