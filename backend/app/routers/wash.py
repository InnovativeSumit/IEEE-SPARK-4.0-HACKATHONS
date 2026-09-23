from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.services.scoring_service import FACILITIES

router = APIRouter(prefix="/api/wash", tags=["wash"])


@router.get("/facilities")
def list_facilities(
    district: Optional[str] = None,
    facility_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(1000, le=3000),
):
    rows = FACILITIES
    if district:
        rows = [f for f in rows if f["district"].lower() == district.lower()]
    if facility_type:
        rows = [f for f in rows if f["facility_type"] == facility_type]
    if status:
        rows = [f for f in rows if f["status"].lower() == status.lower()]
    rows = sorted(rows, key=lambda f: f["disruption_probability"], reverse=True)
    return {"count": len(rows), "results": rows[:limit]}


@router.get("/facilities/{facility_id}")
def get_facility(facility_id: str):
    match = next((f for f in FACILITIES if f["id"].lower() == facility_id.lower()), None)
    if not match:
        raise HTTPException(status_code=404, detail="Facility not found")
    return match


@router.get("/risk")
def risk_summary():
    total = len(FACILITIES)
    critical = sum(1 for f in FACILITIES if f["status"] == "CRITICAL")
    high = sum(1 for f in FACILITIES if f["status"] == "HIGH")
    avg = round(sum(f["disruption_probability"] for f in FACILITIES) / total, 1) if total else 0
    return {
        "total_facilities": total,
        "critical": critical,
        "high": high,
        "average_disruption_probability": avg,
        "by_type": _by_type(),
    }


def _by_type():
    out = {}
    for f in FACILITIES:
        out.setdefault(f["facility_type_label"], {"count": 0, "avg_disruption": 0.0, "_sum": 0.0})
        out[f["facility_type_label"]]["count"] += 1
        out[f["facility_type_label"]]["_sum"] += f["disruption_probability"]
    for k, v in out.items():
        v["avg_disruption"] = round(v["_sum"] / v["count"], 1)
        del v["_sum"]
    return out
