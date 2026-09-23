from fastapi import APIRouter

from app.data.demo_data import FLOOD_GEOJSON
from app.services.scoring_service import COMMUNITIES

router = APIRouter(prefix="/api/flood", tags=["flood"])


@router.get("/geojson")
def flood_geojson():
    return FLOOD_GEOJSON


@router.get("/statistics")
def flood_statistics():
    avg_exposure = round(sum(c["flood_exposure_pct"] for c in COMMUNITIES) / len(COMMUNITIES), 1)
    # rough demo area estimate: each community "cell" ~ a few km^2 weighted by exposure
    flood_area_km2 = round(sum(c["flood_exposure_pct"] / 100 * 3.1 for c in COMMUNITIES), 1)
    by_district = {}
    for c in COMMUNITIES:
        by_district.setdefault(c["district"], []).append(c["flood_exposure_pct"])
    by_district = {d: round(sum(v) / len(v), 1) for d, v in by_district.items()}
    return {
        "average_flood_exposure_pct": avg_exposure,
        "estimated_flood_area_km2": flood_area_km2,
        "flood_exposure_by_district": by_district,
        "data_provenance": "Demo / Research Dataset — synthetic Sentinel-1/2-style flood extent",
    }
