"""
Standalone training script for the WASH disruption model.

The FastAPI app trains an equivalent model in-process at startup
(app/services/ml_service.py) so the hackathon demo runs with zero setup.
This script is the "real" offline counterpart described in the brief:
it loads data, splits train/val/test, trains, evaluates, and persists
a model + metrics/feature-importance file — the shape you'd extend to
train on real Nepal EO-derived features (`flood_extent`, `distance_to_river`,
`elevation`, `road_accessibility`, ...) once they're available.

Usage:
    cd backend
    python ml/train_wash_model.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split

from app.data.demo_data import FACILITIES_RAW

FEATURES = ["flood_exposure_pct", "distance_to_river_km", "elevation_m", "road_accessibility"]
MODEL_DIR = os.getenv("MODEL_PATH", "./ml/models")


def main():
    df = pd.DataFrame(FACILITIES_RAW)
    X = df[FEATURES]

    rng = np.random.default_rng(7)
    logit = (
        0.065 * X["flood_exposure_pct"] - 0.09 * X["distance_to_river_km"]
        - 0.01 * (X["elevation_m"] - 200) - 0.02 * X["road_accessibility"]
        - 3.0 + rng.normal(0, 0.6, len(X))
    )
    y = (rng.random(len(X)) < 1 / (1 + np.exp(-logit))).astype(int)

    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)

    model = xgb.XGBClassifier(
        n_estimators=120, max_depth=3, learning_rate=0.12,
        subsample=0.9, colsample_bytree=0.9, eval_metric="logloss", random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    metrics = {
        "accuracy": round(accuracy_score(y_test, preds), 4),
        "precision": round(precision_score(y_test, preds, zero_division=0), 4),
        "recall": round(recall_score(y_test, preds, zero_division=0), 4),
        "f1": round(f1_score(y_test, preds, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "n_train": len(X_train), "n_val": len(X_val), "n_test": len(X_test),
    }
    feature_importance = dict(zip(FEATURES, [round(float(v), 4) for v in model.feature_importances_]))

    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save_model(os.path.join(MODEL_DIR, "wash_disruption_model.json"))
    with open(os.path.join(MODEL_DIR, "wash_disruption_metadata.json"), "w") as f:
        json.dump({"features": FEATURES, "metrics": metrics, "feature_importance": feature_importance}, f, indent=2)

    print("Training complete.")
    print(json.dumps(metrics, indent=2))
    print(f"Model saved to {MODEL_DIR}/wash_disruption_model.json")


if __name__ == "__main__":
    main()
