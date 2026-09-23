import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_MODE: str = os.getenv("APP_MODE", "demo")
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./ml/models")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    # Scoring weights — exposed so the /api/priority/weights endpoint can
    # surface (and, in a future admin UI, update) the exact formula used.
    WEIGHTS = {
        "flood_exposure": 0.30,
        "wash_disruption": 0.25,
        "population_exposure": 0.20,
        "accessibility_risk": 0.10,
        "vulnerability": 0.10,
        "isolation": 0.05,
    }


settings = Settings()
