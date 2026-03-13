from fastapi import APIRouter
from pydantic import BaseModel
from database import supabase
from services.scoring import score

router = APIRouter()

class Reading(BaseModel):
    asset_id: str
    value:    float
    metadata: dict = {}

class ChatRequest(BaseModel):
    question: str
    context:  str = ""

@router.post("/ingest")
def ingest(reading: Reading):
    result = score(reading.value, reading.metadata)

    supabase.table("readings").insert({
        "asset_id": reading.asset_id,
        "value":    reading.value,
        "metadata": reading.metadata,
    }).execute()

    if result["is_anomaly"]:
        supabase.table("alerts").insert({
            "asset_id": reading.asset_id,
            "severity": result["severity"],
            "score":    result["score"],
            "status":   "open",
        }).execute()

    return result

@router.post("/chat")
def chat(req: ChatRequest):
    from services.scoring import ask_ai
    answer = ask_ai(req.question, req.context)
    return {"answer": answer}