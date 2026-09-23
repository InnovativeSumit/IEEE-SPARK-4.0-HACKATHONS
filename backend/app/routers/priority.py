from fastapi import APIRouter

from app.services.scoring_service import COMMUNITIES
from app.config import settings

router = APIRouter(prefix="/api/priority", tags=["priority"])


@router.get("/map")
def priority_map():
    """GeoJSON-ish point features for the priority layer on the map."""
    features = []
    for c in COMMUNITIES:
        features.append({
            "type": "Feature",
            "properties": {
                "id": c["id"], "name": c["name"], "district": c["district"],
                "priority_score": c["priority_score"], "priority_category": c["priority_category"],
                "population": c["population"], "flood_exposure_pct": c["flood_exposure_pct"],
            },
            "geometry": {"type": "Point", "coordinates": [c["lon"], c["lat"]]},
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/statistics")
def priority_statistics():
    avg = round(sum(c["priority_score"] for c in COMMUNITIES) / len(COMMUNITIES), 1)
    breakdown = {}
    for c in COMMUNITIES:
        breakdown[c["priority_category"]] = breakdown.get(c["priority_category"], 0) + 1
    return {"average_priority_score": avg, "breakdown": breakdown, "total_communities": len(COMMUNITIES)}


@router.get("/weights")
def priority_weights():
    return {"weights": settings.WEIGHTS, "formula": (
        "priority = 0.30*flood_exposure + 0.25*wash_disruption + 0.20*population_exposure "
        "+ 0.10*accessibility_risk + 0.10*vulnerability + 0.05*isolation"
    )}
