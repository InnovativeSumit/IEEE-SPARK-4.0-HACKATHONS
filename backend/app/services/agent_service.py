"""
JALRAKSHA AI Agent.

A small but genuine agentic pipeline:

    question --> [trained intent classifier] --> tool selection
             --> [tool executes against live scoring/cluster/model data]
             --> [vector store RAG retrieval for supporting context]
             --> composed answer + full trace (tools_used, retrieved_sources)

No external LLM call is required to run this demo — the "reasoning" step
is a deterministic tool-dispatch (safe and auditable, exactly what a
disaster-response tool should be), and the vector store supplies grounded
context for anything that doesn't map cleanly onto a single tool. If
ANTHROPIC_API_KEY is set, `synthesize_with_llm` can be wired in later to
phrase the final sentence more fluidly — the trace and underlying numbers
never change, only the prose would.
"""
from typing import Dict, Any, List

from app.services.intent_classifier import intent_classifier
from app.services.knowledge_base import knowledge_base
from app.services.scoring_service import COMMUNITIES, FACILITIES, RESPONSE_ZONES
from app.services.ml_service import wash_model
from app.services.vulnerability_model import vulnerability_model

# ---------------------------------------------------------------- tools ---

def tool_emergency_water_priority(_: str) -> Dict[str, Any]:
    top = COMMUNITIES[:5]
    lines = [f"{c['rank']}. {c['name']} ({c['district']}) — priority {c['priority_score']}/100, "
             f"{c['estimated_population_affected']:,} people estimated affected" for c in top]
    return {
        "answer": "Top communities for emergency water support, by priority score:\n" + "\n".join(lines),
        "supporting_data": top,
        "recommendations": [f"{c['name']}: {c['recommendations'][0]}" for c in top],
    }


def tool_facility_disruption(_: str) -> Dict[str, Any]:
    top = sorted(FACILITIES, key=lambda f: f["disruption_probability"], reverse=True)[:5]
    lines = [f"{f['id']} ({f['facility_type_label']}, {f['municipality']}) — "
             f"{f['disruption_probability']:.0f}% disruption probability, status {f['status']}" for f in top]
    return {
        "answer": "Most likely disrupted WASH facilities:\n" + "\n".join(lines),
        "supporting_data": top,
        "recommendations": ["Dispatch field verification teams to CRITICAL-status facilities first."],
    }


def tool_why_priority(question: str) -> Dict[str, Any]:
    q = question.lower()
    match = next((c for c in COMMUNITIES if c["name"].lower() in q or c["district"].lower() in q), None)
    if not match:
        match = COMMUNITIES[0]
    answer = (
        f"{match['name']} has a WASH Priority Score of {match['priority_score']}/100 "
        f"({match['priority_category']}). " + " ".join(match["why"])
    )
    return {"answer": answer, "supporting_data": [match], "recommendations": match["recommendations"]}


def tool_flood_population_overlap(_: str) -> Dict[str, Any]:
    rows = sorted(COMMUNITIES, key=lambda c: c["flood_exposure_pct"] * c["population"], reverse=True)[:5]
    lines = [f"{c['name']} ({c['district']}) — {c['flood_exposure_pct']:.0f}% flood exposure, "
             f"population {c['population']:,}" for c in rows]
    return {
        "answer": "Communities where flood exposure and population density overlap most:\n" + "\n".join(lines),
        "supporting_data": rows,
        "recommendations": ["Prioritise these for combined water-and-shelter response planning."],
    }


def tool_accessibility(_: str) -> Dict[str, Any]:
    rows = sorted(COMMUNITIES, key=lambda c: c["road_accessibility"])[:5]
    lines = [f"{c['name']} ({c['district']}) — road accessibility {c['road_accessibility']:.0f}/100" for c in rows]
    return {
        "answer": "Communities with the poorest modeled road access:\n" + "\n".join(lines),
        "supporting_data": rows,
        "recommendations": ["Plan boat, air, or manual-portage delivery for these communities."],
    }


def tool_vulnerability_explanation(question: str) -> Dict[str, Any]:
    q = question.lower()
    match = next((c for c in COMMUNITIES if c["name"].lower() in q or c["district"].lower() in q), None)
    if not match:
        match = max(COMMUNITIES, key=lambda c: c["vulnerability_score"])
    factors = ", ".join(f"{f['factor']} ({f['contribution_pct']:+.0f}%)" for f in match["vulnerability_factors"][:3])
    answer = (
        f"{match['name']} has a vulnerability score of {match['vulnerability_score']}/100, predicted by the "
        f"trained vulnerability model (MAE {vulnerability_model.metrics['mae']}, R\u00b2 {vulnerability_model.metrics['r2']}). "
        f"Top contributing factors: {factors}."
    )
    return {"answer": answer, "supporting_data": [match], "recommendations": match["recommendations"]}


def tool_response_zones(_: str) -> Dict[str, Any]:
    lines = [f"Zone {z['zone']}: {z['community_count']} communities, avg priority {z['avg_priority_score']}, "
             f"~{z['total_population_affected']:,} people affected" for z in RESPONSE_ZONES]
    return {
        "answer": "AI-clustered response zones (KMeans over the risk profile), ordered by urgency:\n" + "\n".join(lines),
        "supporting_data": RESPONSE_ZONES,
        "recommendations": [f"Stage response teams for Zone {RESPONSE_ZONES[0]['zone']} first."],
    }


def tool_model_performance(_: str) -> Dict[str, Any]:
    vm = vulnerability_model.metrics
    answer = (
        f"WASH disruption model: XGBoost classifier, training accuracy {wash_model.train_accuracy:.2f}, "
        f"explained with SHAP. Vulnerability model: XGBoost regressor, MAE {vm['mae']}, R\u00b2 {vm['r2']} "
        f"on a held-out test split of {vm['n_test']} communities."
    )
    return {"answer": answer, "supporting_data": [{"model": "wash_disruption", "train_accuracy": wash_model.train_accuracy},
                                                    {"model": "vulnerability", **vm}], "recommendations": []}


def tool_district_summary(question: str) -> Dict[str, Any]:
    q = question.lower()
    district = next((c["district"] for c in COMMUNITIES if c["district"].lower() in q), None)
    if not district:
        return tool_general_overview(question)
    rows = [c for c in COMMUNITIES if c["district"] == district]
    avg = round(sum(r["priority_score"] for r in rows) / len(rows), 1)
    critical = sum(1 for r in rows if r["priority_category"] == "CRITICAL")
    answer = (
        f"{district} district has {len(rows)} mapped communities with an average WASH priority score of "
        f"{avg}/100, including {critical} in the CRITICAL band."
    )
    return {"answer": answer, "supporting_data": rows[:5], "recommendations": ["Review the Communities page filtered to this district for the full ranking."]}


def tool_general_overview(_: str) -> Dict[str, Any]:
    avg_priority = round(sum(c["priority_score"] for c in COMMUNITIES) / len(COMMUNITIES), 1)
    critical = sum(1 for c in COMMUNITIES if c["priority_category"] == "CRITICAL")
    answer = (
        f"{critical} of {len(COMMUNITIES)} communities are in the CRITICAL band, with an average WASH "
        f"priority score of {avg_priority}/100 across {len(RESPONSE_ZONES)} response zones. Ask me about "
        "emergency water priority, disrupted facilities, accessibility, vulnerability, or a specific "
        "district or community."
    )
    return {"answer": answer, "supporting_data": [], "recommendations": []}


TOOLS = {
    "emergency_water_priority": tool_emergency_water_priority,
    "facility_disruption": tool_facility_disruption,
    "why_priority": tool_why_priority,
    "flood_population_overlap": tool_flood_population_overlap,
    "accessibility": tool_accessibility,
    "vulnerability_explanation": tool_vulnerability_explanation,
    "response_zones": tool_response_zones,
    "model_performance": tool_model_performance,
    "district_summary": tool_district_summary,
    "general_overview": tool_general_overview,
}


# ---------------------------------------------------------------- agent ---

def answer_query(question: str) -> Dict[str, Any]:
    intent = intent_classifier.predict(question)
    tool = TOOLS.get(intent, tool_general_overview)
    result = tool(question)

    rag_hits = knowledge_base.search(question, k=3)

    confidence = 0.9 if rag_hits and rag_hits[0]["score"] > 0.3 else 0.75 if intent != "general_overview" else 0.55

    return {
        "answer": result["answer"],
        "supporting_data": result["supporting_data"],
        "recommendations": result.get("recommendations", []),
        "confidence": round(confidence, 2),
        "agent_trace": {
            "intent": intent,
            "tool_used": tool.__name__,
            "retrieved_sources": [
                {"id": h["id"], "relevance": h["score"], "excerpt": h["text"][:160]} for h in rag_hits
            ],
        },
    }
