"""
Vector Store for Retrieval-Augmented Generation.

Runs fully offline (no external embedding API, no network call) using a
TF-IDF vectorizer as the embedding function and cosine similarity for
nearest-neighbour retrieval. Each document is a short, factual text chunk
generated directly from the scoring engine's real output (community
summaries, facility summaries, model metrics, methodology text) — so
retrieval always grounds the chatbot in numbers the platform actually
computed, never in invented text.

This is intentionally simple and dependency-light (scikit-learn only,
already required for the ML models) rather than pulling in a heavyweight
embedding model that needs internet access to download weights — the
hackathon demo must run with zero external calls.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class Document:
    id: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class VectorStore:
    def __init__(self):
        self.documents: List[Document] = []
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=6000)
        self._matrix = None

    def index(self, documents: List[Document]):
        self.documents = documents
        corpus = [d.text for d in documents]
        self._matrix = self.vectorizer.fit_transform(corpus)

    def search(self, query: str, k: int = 5, min_score: float = 0.05) -> List[Dict[str, Any]]:
        if self._matrix is None or not self.documents:
            return []
        q_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(q_vec, self._matrix).flatten()
        top_idx = np.argsort(scores)[::-1][:k]
        results = []
        for i in top_idx:
            if scores[i] < min_score:
                continue
            doc = self.documents[i]
            results.append({
                "id": doc.id,
                "text": doc.text,
                "metadata": doc.metadata,
                "score": round(float(scores[i]), 4),
            })
        return results

    @property
    def size(self) -> int:
        return len(self.documents)
