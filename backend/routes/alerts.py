from fastapi import APIRouter, HTTPException
from database import get_supabase

router = APIRouter()

@router.get("/feedback")
def get_feedback():
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    res = (supabase.table("feedback")
           .select("*")
           .order("created_at", desc=True)
           .execute())
    return res.data

@router.get("/feedback/{idea_id}")
def get_idea_feedback(idea_id: str):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    res = (supabase.table("feedback")
           .select("*")
           .eq("idea_id", idea_id)
           .order("created_at", desc=True)
           .execute())
    return res.data
