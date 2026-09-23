"""
DEMO / RESEARCH DATASET GENERATOR
---------------------------------
Everything produced here is clearly synthetic. It is built so the
*relationships* between variables (distance to river -> flood exposure,
flood exposure -> WASH disruption, accessibility -> priority, etc.) are
physically plausible for a Terai-belt flash-flood scenario, so the ML
and scoring pipeline downstream has real signal to learn from and explain
-- but no value here should ever be presented as an observed 2026 flood
measurement. See DATA_PROVENANCE in schemas for how this is labelled to
the frontend.

Region: a bounding box over Nepal's eastern/central Terai (the belt most
exposed to flash flooding from the Koshi/Bagmati/Rapti river systems),
approximately lat 26.4-27.7 N, lon 85.0-87.5 E.
"""
import math
import random
from typing import List, Dict, Any

random.seed(42)

DISTRICTS = [
    "Saptari", "Siraha", "Sunsari", "Morang", "Rautahat",
    "Bara", "Sarlahi", "Mahottari", "Dhanusha", "Chitwan",
]

MUNICIPALITIES = {
    "Saptari": ["Rajbiraj", "Kanchanrup", "Bodebarsain"],
    "Siraha": ["Siraha", "Lahan", "Mirchaiya"],
    "Sunsari": ["Itahari", "Dharan", "Inaruwa"],
    "Morang": ["Biratnagar", "Rangeli", "Sundarharaicha"],
    "Rautahat": ["Gaur", "Chandrapur", "Garuda"],
    "Bara": ["Kalaiya", "Jeetpur Simara", "Nijgadh"],
    "Sarlahi": ["Malangwa", "Haripur", "Lalbandi"],
    "Mahottari": ["Jaleshwar", "Bardibas", "Gaushala"],
    "Dhanusha": ["Janakpur", "Mithila", "Nagarain"],
    "Chitwan": ["Bharatpur", "Ratnanagar", "Khairahani"],
}

FACILITY_TYPES = [
    ("water_treatment", "Water Treatment Plant"),
    ("tube_well", "Tube Well"),
    ("public_tap", "Public Tap"),
    ("reservoir", "Reservoir / Water Tank"),
    ("toilet_block", "Community Toilet Block"),
    ("sewage", "Sewage / Drainage Point"),
]

# A rough synthetic "river" polyline that flood exposure decays from.
RIVER_PATH = [
    (26.45, 86.05), (26.60, 86.30), (26.80, 86.55),
    (27.00, 86.75), (27.20, 86.95), (27.40, 87.10), (27.60, 87.25),
]


def _dist_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _dist_to_river(lat, lon):
    return min(_dist_km(lat, lon, rlat, rlon) for rlat, rlon in RIVER_PATH)


def _clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def generate_communities(n: int = 140) -> List[Dict[str, Any]]:
    communities = []
    for i in range(n):
        district = random.choice(DISTRICTS)
        municipality = random.choice(MUNICIPALITIES[district])
        lat = random.uniform(26.42, 27.68)
        lon = random.uniform(85.05, 87.45)

        river_dist = _dist_to_river(lat, lon)
        elevation = _clamp(60 + river_dist * 9 + random.gauss(0, 25), 45, 620)
        rainfall_proxy = _clamp(random.gauss(78, 14), 30, 100)  # 0-100 relative intensity

        # Flood exposure: high near the river and at low elevation, boosted by rainfall
        flood_exposure = _clamp(
            100 - river_dist * 6.2 - (elevation - 45) * 0.11 + (rainfall_proxy - 60) * 0.35
            + random.gauss(0, 6)
        )

        population = int(_clamp(random.gauss(9000, 4200), 800, 28000))
        road_access = _clamp(100 - river_dist * 3.1 - flood_exposure * 0.35 + random.gauss(0, 10), 5, 98)
        accessibility_risk = _clamp(100 - road_access)

        n_facilities = max(2, int(_clamp(random.gauss(9, 3), 2, 22)))

        communities.append({
            "id": f"C{i+1:03d}",
            "name": f"{municipality} Ward {random.randint(1, 14)}",
            "district": district,
            "municipality": municipality,
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "population": population,
            "elevation_m": round(elevation, 1),
            "distance_to_river_km": round(river_dist, 2),
            "rainfall_index": round(rainfall_proxy, 1),
            "flood_exposure_pct": round(flood_exposure, 1),
            "road_accessibility": round(road_access, 1),
            "accessibility_risk": round(accessibility_risk, 1),
            "num_wash_facilities": n_facilities,
        })
    return communities


def generate_facilities(communities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    facilities = []
    counter = 1
    for c in communities:
        for _ in range(c["num_wash_facilities"]):
            ftype, ftype_label = random.choice(FACILITY_TYPES)
            jitter_lat = c["lat"] + random.uniform(-0.02, 0.02)
            jitter_lon = c["lon"] + random.uniform(-0.02, 0.02)
            river_dist = _dist_to_river(jitter_lat, jitter_lon)

            facility_flood_exposure = _clamp(
                c["flood_exposure_pct"] + random.gauss(0, 8)
            )
            # low-lying facility types (toilets, sewage) are more exposed
            if ftype in ("toilet_block", "sewage"):
                facility_flood_exposure = _clamp(facility_flood_exposure + 6)

            facilities.append({
                "id": f"WS-{counter:04d}",
                "name": f"{ftype_label} {counter}",
                "facility_type": ftype,
                "facility_type_label": ftype_label,
                "community_id": c["id"],
                "district": c["district"],
                "municipality": c["municipality"],
                "lat": round(jitter_lat, 5),
                "lon": round(jitter_lon, 5),
                "distance_to_river_km": round(river_dist, 2),
                "flood_exposure_pct": round(facility_flood_exposure, 1),
                "road_accessibility": c["road_accessibility"],
                "elevation_m": c["elevation_m"],
            })
            counter += 1
    return facilities


def generate_flood_polygons() -> Dict[str, Any]:
    """A small set of synthetic flood-extent polygons hugging the river path,
    at three severity bands, for map display in demo mode."""
    features = []
    bands = [("CRITICAL", 0.06, "#dc2626"), ("HIGH", 0.11, "#f59e0b"), ("MODERATE", 0.17, "#3b82f6")]
    for severity, half_width, color in bands:
        coords = []
        for lat, lon in RIVER_PATH:
            coords.append([lon - half_width, lat - half_width * 0.5])
        for lat, lon in reversed(RIVER_PATH):
            coords.append([lon + half_width, lat + half_width * 0.5])
        coords.append(coords[0])
        features.append({
            "type": "Feature",
            "properties": {"severity": severity, "color": color, "label": "Demo / Research Dataset"},
            "geometry": {"type": "Polygon", "coordinates": [coords]},
        })
    return {"type": "FeatureCollection", "features": features}


COMMUNITIES_RAW = generate_communities()
FACILITIES_RAW = generate_facilities(COMMUNITIES_RAW)
FLOOD_GEOJSON = generate_flood_polygons()
