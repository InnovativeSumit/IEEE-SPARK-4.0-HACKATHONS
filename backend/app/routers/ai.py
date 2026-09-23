from fastapi import APIRouter
from pydantic import BaseModel

from app.services.agent_service import answer_query

router = APIRouter(prefix="/api/ai", tags=["ai"])


class QueryIn(BaseModel):
    question: str


@router.post("/query")
def query(payload: QueryIn):
    """Agentic RAG endpoint: trained intent classifier -> tool call against
    live scoring data -> vector-store retrieval for grounding context."""
    return answer_query(payload.question)
