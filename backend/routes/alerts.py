from fastapi import APIRouter
from database import supabase

router = APIRouter()

@router.get("/feedback")
def get_feedback():
    res = (supabase.table("feedback")
           .select("*")
           .order("created_at", desc=True)
           .execute())
    return res.data

@router.get("/feedback/{idea_id}")
def get_idea_feedback(idea_id: str):
    res = (supabase.table("feedback")
           .select("*")
           .eq("idea_id", idea_id)
           .order("created_at", desc=True)
           .execute())
    return res.data