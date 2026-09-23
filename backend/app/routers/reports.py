import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.scoring_service import COMMUNITIES, FACILITIES, RESPONSE_ZONES

router = APIRouter(tags=["reports"])


@router.get("/api/reports/summary")
def report_summary():
    critical = [c for c in COMMUNITIES if c["priority_category"] == "CRITICAL"]
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "DEMO MODE — Simulated / Research Dataset",
        "event_summary": "Synthetic post-flood WASH assessment generated for the SPARK 4.0 EO Hackathon demo.",
        "affected_population": sum(c["estimated_population_affected"] for c in COMMUNITIES),
        "flooded_area_km2": round(sum(c["flood_exposure_pct"] / 100 * 3.1 for c in COMMUNITIES), 1),
        "critical_communities": len(critical),
        "critical_facility_count": sum(1 for f in FACILITIES if f["status"] == "CRITICAL"),
        "top_priority_communities": COMMUNITIES[:10],
        "methodology": (
            "Flood exposure, WASH disruption (XGBoost + SHAP), population exposure, accessibility risk, "
            "vulnerability (XGBoost + SHAP) and isolation are combined with a transparent weighted formula "
            "(see /api/priority/weights) into a 0-100 WASH Priority Score. Communities are additionally "
            "grouped into response zones with KMeans clustering, and the AI Analyst answers questions "
            "through a trained intent-classification agent backed by a retrieval-augmented (RAG) knowledge base."
        ),
        "response_zones": RESPONSE_ZONES,
        "data_sources": [
            "Sentinel-1 SAR (flood extent) — demo",
            "Sentinel-2 optical — demo",
            "OpenStreetMap WASH facilities — demo",
            "Population raster — demo",
            "DEM / elevation — demo",
        ],
        "limitations": (
            "All figures are generated from a synthetic research dataset for demonstration purposes. "
            "No value on this platform should be treated as an observed measurement of the actual 2026 flood."
        ),
    }


@router.get("/api/reports/communities.csv")
def report_communities_csv():
    buf = io.StringIO()
    fieldnames = [
        "rank", "id", "name", "district", "municipality", "population",
        "flood_exposure_pct", "wash_disruption_risk", "population_exposure",
        "accessibility_risk", "vulnerability_score", "isolation",
        "priority_score", "priority_category", "estimated_population_affected",
        "num_wash_facilities", "at_risk_facilities", "response_zone",
    ]
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for c in COMMUNITIES:
        writer.writerow(c)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=jalraksha_priority_communities.csv"},
    )


class AnalysisRunIn(BaseModel):
    region: str = "all"
    date: str | None = None
    mode: str = "demo"


@router.post("/api/analysis/run")
def analysis_run(payload: AnalysisRunIn):
    rows = COMMUNITIES
    if payload.region and payload.region.lower() != "all":
        rows = [c for c in rows if c["district"].lower() == payload.region.lower() or c["id"] == payload.region]
    if not rows:
        rows = COMMUNITIES
    return {
        "region": payload.region,
        "mode": payload.mode,
        "flood_area_km2": round(sum(c["flood_exposure_pct"] / 100 * 3.1 for c in rows), 1),
        "affected_population": sum(c["estimated_population_affected"] for c in rows),
        "at_risk_wash_facilities": sum(
            1 for f in FACILITIES if f["community_id"] in {c["id"] for c in rows} and f["disruption_probability"] >= 60
        ),
        "critical_communities": sum(1 for c in rows if c["priority_category"] == "CRITICAL"),
        "average_priority_score": round(sum(c["priority_score"] for c in rows) / len(rows), 1),
    }
