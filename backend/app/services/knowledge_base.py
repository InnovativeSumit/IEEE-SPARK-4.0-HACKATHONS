"""
Knowledge base construction for the RAG layer.

Turns the scoring engine's actual output into short factual text chunks
(one per community, one per district, one per facility type, plus a
handful of static methodology/model chunks) and indexes them into the
offline TF-IDF vector store. The agent retrieves the most relevant chunks
for a question and uses them as grounding context — this is what makes
the chatbot "RAG" rather than a template dispatcher alone: free-text
questions that don't cleanly match a tool intent still get a relevant,
numbers-backed context passage instead of a generic non-answer.
"""
from typing import List

from app.services.vector_store import VectorStore, Document
from app.services.scoring_service import COMMUNITIES, FACILITIES, RESPONSE_ZONES
from app.services.ml_service import wash_model
from app.services.vulnerability_model import vulnerability_model

STATIC_CHUNKS = [
    Document(
        id="methodology-overview",
        text=(
            "JALRAKSHA AI computes a WASH Priority Score from 0 to 100 for every community using a "
            "transparent weighted formula: 30% flood exposure, 25% WASH disruption risk (from a trained "
            "XGBoost classifier), 20% population exposure, 10% accessibility risk, 10% vulnerability "
            "(from a trained XGBoost regressor), and 5% isolation. Scores of 90+ are CRITICAL, 75-89 "
            "VERY HIGH, 60-74 HIGH, 40-59 MODERATE, and below 40 LOW."
        ),
        metadata={"type": "methodology"},
    ),
    Document(
        id="data-provenance",
        text=(
            "This deployment runs in DEMO MODE. All flood extent, population, and infrastructure figures "
            "come from a synthetic, seeded research dataset built for the SPARK 4.0 EO Hackathon, not from "
            "observed 2026 flood imagery. The architecture supports swapping in real Sentinel-1/2, DEM, "
            "population and OpenStreetMap data via environment variables."
        ),
        metadata={"type": "provenance"},
    ),
]


def _model_metric_chunks() -> List[Document]:
    vm = vulnerability_model.metrics
    return [
        Document(
            id="model-wash-disruption",
            text=(
                f"The WASH disruption risk model is an XGBoost classifier with training accuracy "
                f"{getattr(wash_model, 'train_accuracy', 0):.2f}. It is explained per-prediction using SHAP, "
                "with flood exposure and distance to river as the dominant contributing factors."
            ),
            metadata={"type": "model_metrics", "model": "wash_disruption"},
        ),
        Document(
            id="model-vulnerability",
            text=(
                f"The community vulnerability model is an XGBoost regressor with a held-out MAE of "
                f"{vm['mae']} and R-squared of {vm['r2']}, trained on {vm['n_train']} communities and "
                f"tested on {vm['n_test']}. Key drivers are road accessibility, remoteness from the river "
                "corridor, and WASH facility density."
            ),
            metadata={"type": "model_metrics", "model": "vulnerability"},
        ),
    ]


def _community_chunks() -> List[Document]:
    docs = []
    for c in COMMUNITIES:
        text = (
            f"{c['name']} in {c['municipality']}, {c['district']} district has a WASH Priority Score of "
            f"{c['priority_score']}/100 ({c['priority_category']}), assigned to response zone {c['response_zone']}. "
            f"Flood exposure is {c['flood_exposure_pct']}%, WASH disruption risk {c['wash_disruption_risk']}%, "
            f"population exposure {c['population_exposure']}%, accessibility risk {c['accessibility_risk']}%, "
            f"and vulnerability {c['vulnerability_score']}%. An estimated {c['estimated_population_affected']:,} "
            f"people are affected, with {c['at_risk_facilities']} of {c['num_wash_facilities']} WASH facilities "
            f"at risk. Recommended action: {c['recommendations'][0]}"
        )
        docs.append(Document(id=f"community-{c['id']}", text=text, metadata={"type": "community", "id": c["id"]}))
    return docs


def _district_chunks() -> List[Document]:
    by_district = {}
    for c in COMMUNITIES:
        by_district.setdefault(c["district"], []).append(c)
    docs = []
    for district, rows in by_district.items():
        avg = round(sum(r["priority_score"] for r in rows) / len(rows), 1)
        critical = sum(1 for r in rows if r["priority_category"] == "CRITICAL")
        text = (
            f"{district} district has {len(rows)} mapped communities with an average WASH priority score "
            f"of {avg}/100, including {critical} communities in the CRITICAL band."
        )
        docs.append(Document(id=f"district-{district}", text=text, metadata={"type": "district", "district": district}))
    return docs


def _facility_type_chunks() -> List[Document]:
    by_type = {}
    for f in FACILITIES:
        by_type.setdefault(f["facility_type_label"], []).append(f)
    docs = []
    for ftype, rows in by_type.items():
        avg = round(sum(r["disruption_probability"] for r in rows) / len(rows), 1)
        critical = sum(1 for r in rows if r["status"] == "CRITICAL")
        text = (
            f"{ftype} facilities: {len(rows)} mapped, average disruption probability {avg}%, "
            f"{critical} currently in CRITICAL status."
        )
        docs.append(Document(id=f"facility-type-{ftype}", text=text, metadata={"type": "facility_type"}))
    return docs


def _zone_chunks() -> List[Document]:
    docs = []
    for z in RESPONSE_ZONES:
        text = (
            f"Response Zone {z['zone']} covers {z['community_count']} communities with an average priority "
            f"score of {z['avg_priority_score']}/100 and an estimated {z['total_population_affected']:,} people "
            f"affected. Representative communities: {', '.join(z['sample_communities'])}."
        )
        docs.append(Document(id=f"zone-{z['zone']}", text=text, metadata={"type": "zone", "zone": z["zone"]}))
    return docs


def build_knowledge_base() -> VectorStore:
    store = VectorStore()
    docs = (
        STATIC_CHUNKS
        + _model_metric_chunks()
        + _community_chunks()
        + _district_chunks()
        + _facility_type_chunks()
        + _zone_chunks()
    )
    store.index(docs)
    return store


knowledge_base = build_knowledge_base()
