from fastapi import APIRouter

from app.services.scoring_service import COMMUNITIES, FACILITIES, RESPONSE_ZONES
from app.config import settings

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/clusters")
def response_zones():
    """AI-clustered (KMeans) response zones over the community risk profile."""
    return {"zones": RESPONSE_ZONES}


@router.get("/overview")
def overview():
    affected_population = sum(c["estimated_population_affected"] for c in COMMUNITIES)
    flooded_area = round(sum(c["flood_exposure_pct"] / 100 * 3.1 for c in COMMUNITIES), 1)
    at_risk_facilities = sum(1 for f in FACILITIES if f["disruption_probability"] >= 60)
    critical_communities = sum(1 for c in COMMUNITIES if c["priority_category"] == "CRITICAL")
    avg_wash_risk = round(sum(c["wash_disruption_risk"] for c in COMMUNITIES) / len(COMMUNITIES), 1)
    accessibility_disruptions = sum(1 for c in COMMUNITIES if c["accessibility_risk"] > 70)

    by_category = {}
    for c in COMMUNITIES:
        by_category[c["priority_category"]] = by_category.get(c["priority_category"], 0) + 1

    return {
        "mode": settings.APP_MODE,
        "affected_population": affected_population,
        "flooded_area_km2": flooded_area,
        "at_risk_wash_facilities": at_risk_facilities,
        "total_wash_facilities": len(FACILITIES),
        "critical_communities": critical_communities,
        "total_communities": len(COMMUNITIES),
        "average_wash_risk": avg_wash_risk,
        "accessibility_disruptions": accessibility_disruptions,
        "priority_breakdown": by_category,
        "alerts": _alerts(critical_communities, accessibility_disruptions),
    }


@router.get("/before-after")
def before_after():
    """Synthetic before/after comparison for the temporal-slider feature."""
    before = {
        "flooded_area_km2": 0.0,
        "wash_facilities_disrupted": 0,
        "road_accessibility_avg": round(
            sum(c["road_accessibility"] for c in COMMUNITIES) / len(COMMUNITIES) + 22, 1
        ),
        "label": "Pre-flood baseline (Demo / Research Dataset)",
    }
    after = {
        "flooded_area_km2": round(sum(c["flood_exposure_pct"] / 100 * 3.1 for c in COMMUNITIES), 1),
        "wash_facilities_disrupted": sum(1 for f in FACILITIES if f["disruption_probability"] >= 60),
        "road_accessibility_avg": round(sum(c["road_accessibility"] for c in COMMUNITIES) / len(COMMUNITIES), 1),
        "label": "Post-flood modeled state (Demo / Research Dataset)",
    }
    return {"before": before, "after": after}


def _alerts(critical_communities, accessibility_disruptions):
    alerts = []
    if critical_communities > 0:
        alerts.append({
            "level": "critical",
            "message": f"{critical_communities} high-priority communities have estimated severe WASH disruption.",
        })
    if accessibility_disruptions > 0:
        alerts.append({
            "level": "warning",
            "message": f"{accessibility_disruptions} priority communities have severely constrained road access.",
        })
    alerts.append({
        "level": "info",
        "message": "Running in DEMO MODE — all figures are from a synthetic research dataset, not observed imagery.",
    })
    return alerts
