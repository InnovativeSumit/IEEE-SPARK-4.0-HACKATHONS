from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import communities, wash, flood, analytics, ai, priority, reports, data_sources, models

app = FastAPI(
    title="JALRAKSHA AI",
    description="EO-powered WASH intelligence and community prioritisation platform — "
                "SPARK 4.0 EO Hackathon 2026, Problem Statement 05 (After the Flood: WASH).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(communities.router)
app.include_router(wash.router)
app.include_router(flood.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(priority.router)
app.include_router(reports.router)
app.include_router(data_sources.router)
app.include_router(models.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": settings.APP_MODE, "service": "jalraksha-ai-backend"}


@app.get("/")
def root():
    return {"message": "JALRAKSHA AI backend is running. See /docs for the API reference."}
