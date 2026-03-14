from fastapi import APIRouter, HTTPException
from database import get_supabase

router = APIRouter()

@router.get("/ideas")
def get_ideas():
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    res = supabase.table("ideas").select("*").order("created_at", desc=True).execute()
    return res.data

@router.get("/ideas/{idea_id}")
def get_idea(idea_id: str):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    res = (supabase.table("ideas")
           .select("*")
           .eq("id", idea_id)
           .single()
           .execute())
    return res.data
