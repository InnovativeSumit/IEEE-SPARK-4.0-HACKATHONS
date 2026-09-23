from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.services.scoring_service import COMMUNITIES

router = APIRouter(prefix="/api/communities", tags=["communities"])


@router.get("")
def list_communities(
    district: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(200, le=500),
):
    rows = COMMUNITIES
    if district:
        rows = [c for c in rows if c["district"].lower() == district.lower()]
    if category:
        rows = [c for c in rows if c["priority_category"].lower() == category.lower()]
    return {"count": len(rows), "results": rows[:limit]}


@router.get("/ranking")
def ranking(limit: int = Query(50, le=500)):
    return {"count": len(COMMUNITIES), "results": COMMUNITIES[:limit]}


@router.get("/{community_id}")
def get_community(community_id: str):
    match = next((c for c in COMMUNITIES if c["id"].lower() == community_id.lower()), None)
    if not match:
        raise HTTPException(status_code=404, detail="Community not found")
    return match
