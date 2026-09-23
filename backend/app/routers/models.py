from fastapi import APIRouter

from app.services.ml_service import wash_model
from app.services.vulnerability_model import vulnerability_model
from app.services.knowledge_base import knowledge_base
from app.services.intent_classifier import intent_classifier

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("/performance")
def performance():
    return {
        "wash_disruption_model": {
            "type": "XGBoost Classifier",
            "train_accuracy": round(wash_model.train_accuracy, 3),
            "explainability": "SHAP TreeExplainer" if wash_model.explainer else "feature_importances_ (SHAP unavailable)",
            "features": ["flood_exposure_pct", "distance_to_river_km", "elevation_m", "road_accessibility"],
        },
        "vulnerability_model": {
            "type": "XGBoost Regressor",
            **vulnerability_model.metrics,
            "explainability": "SHAP TreeExplainer" if vulnerability_model.explainer else "feature_importances_ (SHAP unavailable)",
            "features": ["distance_to_river_km", "road_accessibility", "elevation_m", "rainfall_index", "num_wash_facilities"],
        },
        "response_zone_clustering": {
            "type": "KMeans",
            "features": ["flood_exposure_pct", "wash_disruption_risk", "population_exposure", "accessibility_risk", "vulnerability_score"],
        },
    }


@router.get("/rag-index")
def rag_index():
    return {
        "vector_store": "TF-IDF + cosine similarity (offline, no external embedding API)",
        "indexed_documents": knowledge_base.size,
        "intent_classifier": {
            "type": "TF-IDF + Nearest Centroid",
            "training_examples": intent_classifier.n_examples,
            "intents": intent_classifier.n_intents,
        },
    }
