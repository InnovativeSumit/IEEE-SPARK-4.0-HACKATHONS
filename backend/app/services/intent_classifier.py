"""
Intent classifier for the JALRAKSHA AI Agent.

A small, genuinely-trained scikit-learn model rather than pure regex
matching: TF-IDF vectorises a curated bank of example questions per
intent, and a Nearest-Centroid classifier is fit on those examples. At
query time the user's question is embedded the same way and matched to
the closest intent centroid. Each intent maps 1:1 to an agent "tool"
(see agent_service.py) that pulls real numbers from the scoring engine —
the classifier only ever decides *which tool to call*, never generates
the answer text itself, so it cannot introduce fabricated figures.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestCentroid

TRAINING_EXAMPLES = {
    "emergency_water_priority": [
        "which communities should receive emergency water support first",
        "who needs water first",
        "deploy emergency water",
        "where should mobile water treatment units go",
        "top priority communities for water",
        "which areas need water trucks first",
    ],
    "facility_disruption": [
        "which wash facilities are most likely disrupted",
        "show me at risk water facilities",
        "which facilities are critical",
        "list disrupted toilets and water points",
        "worst affected infrastructure",
    ],
    "why_priority": [
        "why is this community critical",
        "why is district x high priority",
        "explain the priority score for",
        "what factors drove this score",
        "reason for the priority ranking",
    ],
    "flood_population_overlap": [
        "show areas where flood exposure and population density overlap",
        "where does flooding hit the most people",
        "high population high flood areas",
        "overlap of flood and population",
    ],
    "accessibility": [
        "which communities have poor road access",
        "worst road accessibility",
        "hardest to reach communities",
        "logistics access problems",
    ],
    "vulnerability_explanation": [
        "why is this community vulnerable",
        "explain the vulnerability score",
        "what drives vulnerability here",
        "vulnerability model factors",
    ],
    "response_zones": [
        "what are the response zones",
        "group communities into clusters",
        "how should we cluster the response",
        "show operational zones",
        "cluster communities for logistics",
    ],
    "model_performance": [
        "how accurate is the model",
        "what is the model confidence",
        "model performance metrics",
        "how good is the ai",
        "show me the accuracy and r2 score",
    ],
    "district_summary": [
        "summarize district",
        "how is this district doing",
        "district overview",
        "tell me about this district",
    ],
    "general_overview": [
        "give me an overview",
        "what is the current situation",
        "summary of the flood response",
        "hello",
        "what can you help with",
    ],
}


class IntentClassifier:
    def __init__(self):
        texts, labels = [], []
        for intent, examples in TRAINING_EXAMPLES.items():
            for ex in examples:
                texts.append(ex)
                labels.append(intent)

        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        X = self.vectorizer.fit_transform(texts)
        self.classifier = NearestCentroid()
        self.classifier.fit(X, labels)
        self.n_examples = len(texts)
        self.n_intents = len(TRAINING_EXAMPLES)

    def predict(self, question: str) -> str:
        x = self.vectorizer.transform([question.lower()])
        return str(self.classifier.predict(x)[0])


intent_classifier = IntentClassifier()
