"""
WASH Priority Scoring Engine.

Implements, verbatim, the weighted formula specified for the platform:

    Priority = 0.30*FloodExposure + 0.25*WashDisruption + 0.20*PopulationExposure
             + 0.10*AccessibilityRisk + 0.10*Vulnerability + 0.05*Isolation

All six inputs and the final score are 0-100. Weights live in app.config
so they can be surfaced (and eventually made configurable) via
GET /api/priority/weights instead of being hidden in the model.
"""
from typing import List, Dict, Any
import statistics

from app.config import settings
from app.data.demo_data import COMMUNITIES_RAW, FACILITIES_RAW
from app.services.ml_service import wash_model
from app.services.vulnerability_model import vulnerability_model
from app.services.cluster_service import build_clusters

W = settings.WEIGHTS


def _category(score: float) -> str:
    if score >= 90:
        return "CRITICAL"
    if score >= 75:
        return "VERY HIGH"
    if score >= 60:
        return "HIGH"
    if score >= 40:
        return "MODERATE"
    return "LOW"


def _facility_status(prob: float) -> str:
    if prob >= 80:
        return "CRITICAL"
    if prob >= 60:
        return "HIGH"
    if prob >= 35:
        return "MODERATE"
    return "LOW"


def _recommendations(c: Dict[str, Any]) -> List[str]:
    recs = []
    if c["wash_disruption_risk"] > 80 and c["population_exposure"] > 70:
        recs.append("Deploy emergency drinking-water distribution.")
    if c["sanitation_disruption_proxy"] > 80:
        recs.append("Prioritise emergency sanitation and hygiene interventions.")
    if c["accessibility_risk"] > 70:
        recs.append("Consider alternate logistics routes or boat/air water delivery.")
    if c["facility_disruption_share"] > 85:
        recs.append("Dispatch a WASH infrastructure assessment team for field verification.")
    if not recs:
        recs.append("Continue routine monitoring; no emergency WASH action indicated at this time.")
    return recs


def _why(c: Dict[str, Any]) -> List[str]:
    bullets = [
        f"{c['flood_exposure_pct']:.0f}% of the community area falls within the modeled flood extent.",
        f"{c['at_risk_facilities']}/{c['num_wash_facilities']} mapped WASH facilities are in the high-exposure zone.",
        f"Road accessibility is modeled at {c['road_accessibility']:.0f}/100 "
        f"({'severely' if c['accessibility_risk'] > 70 else 'moderately' if c['accessibility_risk'] > 40 else 'mildly'} reduced).",
        f"Estimated population exposure is {c['population_exposure']:.0f}/100, covering roughly "
        f"{c['estimated_population_affected']:,} people.",
    ]
    if c["vulnerability_score"] > 65:
        bullets.append(f"Vulnerability score of {c['vulnerability_score']:.0f}/100 reflects limited alternative water access and low elevation.")
    return bullets


def build_dataset():
    # ---- Facilities: run each through the WASH disruption model ----
    facilities = []
    for f in FACILITIES_RAW:
        pred = wash_model.predict_row(f)
        prob = pred["disruption_probability"]
        facilities.append({
            **f,
            "disruption_probability": prob,
            "status": _facility_status(prob),
            "model_confidence": pred["model_confidence"],
            "top_factors": pred["top_factors"],
        })

    facilities_by_community: Dict[str, List[dict]] = {}
    for f in facilities:
        facilities_by_community.setdefault(f["community_id"], []).append(f)

    # normalize population for population-exposure component
    pops = [c["population"] for c in COMMUNITIES_RAW]
    pop_min, pop_max = min(pops), max(pops)

    communities = []
    for c in COMMUNITIES_RAW:
        cf = facilities_by_community.get(c["id"], [])
        wash_disruption_risk = statistics.mean([f["disruption_probability"] for f in cf]) if cf else 0.0
        at_risk_facilities = sum(1 for f in cf if f["disruption_probability"] >= 60)
        sanitation_facilities = [f for f in cf if f["facility_type"] in ("toilet_block", "sewage")]
        sanitation_disruption_proxy = (
            statistics.mean([f["disruption_probability"] for f in sanitation_facilities])
            if sanitation_facilities else wash_disruption_risk
        )
        facility_disruption_share = (at_risk_facilities / len(cf) * 100) if cf else 0.0

        pop_norm = (c["population"] - pop_min) / (pop_max - pop_min) * 100 if pop_max > pop_min else 50.0
        population_exposure = round(0.6 * pop_norm + 0.4 * c["flood_exposure_pct"], 1)
        estimated_population_affected = int(c["population"] * (c["flood_exposure_pct"] / 100) * 0.85)

        vuln_pred = vulnerability_model.predict_row(c)
        vulnerability_score = vuln_pred["vulnerability_score"]
        vulnerability_factors = vuln_pred["top_factors"]
        # isolation: fewer WASH facilities per capita + high disruption share => isolated
        facilities_per_1000 = (len(cf) / max(c["population"], 1)) * 1000
        isolation = round(_clamp(100 - facilities_per_1000 * 12) * 0.5 + facility_disruption_share * 0.5, 1)

        priority_score = round(
            W["flood_exposure"] * c["flood_exposure_pct"]
            + W["wash_disruption"] * wash_disruption_risk
            + W["population_exposure"] * population_exposure
            + W["accessibility_risk"] * c["accessibility_risk"]
            + W["vulnerability"] * vulnerability_score
            + W["isolation"] * isolation,
            1,
        )

        record = {
            **c,
            "wash_disruption_risk": round(wash_disruption_risk, 1),
            "num_wash_facilities": len(cf),
            "at_risk_facilities": at_risk_facilities,
            "facility_disruption_share": round(facility_disruption_share, 1),
            "sanitation_disruption_proxy": round(sanitation_disruption_proxy, 1),
            "population_exposure": population_exposure,
            "estimated_population_affected": estimated_population_affected,
            "vulnerability_score": vulnerability_score,
            "vulnerability_factors": vulnerability_factors,
            "isolation": isolation,
            "priority_score": priority_score,
            "priority_category": _category(priority_score),
        }
        record["recommendations"] = _recommendations(record)
        record["why"] = _why(record)
        communities.append(record)

        for f in cf:
            f["priority_score"] = priority_score
            f["community_name"] = c["name"]

    communities.sort(key=lambda x: x["priority_score"], reverse=True)
    for i, c in enumerate(communities):
        c["rank"] = i + 1

    zones = build_clusters(communities)
    community_zone = {}
    for zone in zones:
        for cid in zone["communities"]:
            community_zone[cid] = zone["zone"]
    for c in communities:
        c["response_zone"] = community_zone.get(c["id"], "Unassigned")

    return communities, facilities, zones


def _clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


COMMUNITIES, FACILITIES, RESPONSE_ZONES = build_dataset()
