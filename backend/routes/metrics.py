from fastapi import APIRouter, HTTPException
from database import get_supabase

router = APIRouter()

@router.get("/metrics")
def get_metrics():
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    ideas    = supabase.table("ideas").select("*").execute().data
    feedback = supabase.table("feedback").select("*").execute().data
    attempts = supabase.table("pitch_attempts").select("*").execute().data

    avg_score = 0
    if ideas:
        scores = [i.get("score", 0) for i in ideas if i.get("score")]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "total_ideas":     len(ideas),
        "total_feedback":  len(feedback),
        "pitch_attempts":  len(attempts),
        "avg_idea_score":  avg_score,
        "promising_ideas": len([i for i in ideas if i.get("score", 0) >= 7]),
    }
