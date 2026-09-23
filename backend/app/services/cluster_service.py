"""
Response Zone Clustering.

Groups communities into operational response zones using KMeans over
their risk profile (flood exposure, WASH disruption, population exposure,
accessibility risk, vulnerability). This is a genuine unsupervised ML
step used for logistics planning: communities in the same zone have a
similar risk signature and can reasonably share a response team / supply
route, independent of raw geographic proximity.
"""
from typing import List, Dict, Any
import numpy as np
from sklearn.cluster import KMeans

FEATURES = ["flood_exposure_pct", "wash_disruption_risk", "population_exposure", "accessibility_risk", "vulnerability_score"]

ZONE_LABELS = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"]


def build_clusters(communities: List[Dict[str, Any]], n_clusters: int = 5) -> List[Dict[str, Any]]:
    if len(communities) < n_clusters:
        n_clusters = max(1, len(communities))

    X = np.array([[c[f] for f in FEATURES] for c in communities])
    km = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    labels = km.fit_predict(X)

    # Order zones by mean priority score so "Zone Alpha" is always the most urgent
    zone_priority = {}
    for lbl in set(labels):
        idx = [i for i, l in enumerate(labels) if l == lbl]
        zone_priority[lbl] = np.mean([communities[i]["priority_score"] for i in idx])
    ordered = sorted(zone_priority.items(), key=lambda kv: kv[1], reverse=True)
    zone_name_map = {lbl: ZONE_LABELS[i] if i < len(ZONE_LABELS) else f"Zone {i+1}" for i, (lbl, _) in enumerate(ordered)}

    zones: Dict[str, Dict[str, Any]] = {}
    for i, c in enumerate(communities):
        zone_name = zone_name_map[labels[i]]
        zones.setdefault(zone_name, {"zone": zone_name, "communities": [], "centroid": {}})
        zones[zone_name]["communities"].append(c["id"])

    for zone_name, info in zones.items():
        members = [c for c in communities if c["id"] in info["communities"]]
        info["community_count"] = len(members)
        info["total_population_affected"] = int(sum(m["estimated_population_affected"] for m in members))
        info["avg_priority_score"] = round(sum(m["priority_score"] for m in members) / len(members), 1)
        info["centroid"] = {f: round(sum(m[f] for m in members) / len(members), 1) for f in FEATURES}
        info["sample_communities"] = [m["name"] for m in sorted(members, key=lambda m: -m["priority_score"])[:5]]

    return sorted(zones.values(), key=lambda z: z["avg_priority_score"], reverse=True)
