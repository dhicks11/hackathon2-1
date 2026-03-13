from fastapi import APIRouter
from database import supabase

router = APIRouter()

@router.get("/ideas")
def get_ideas():
    res = supabase.table("ideas").select("*").order("created_at", desc=True).execute()
    return res.data

@router.get("/ideas/{idea_id}")
def get_idea(idea_id: str):
    res = (supabase.table("ideas")
           .select("*")
           .eq("id", idea_id)
           .single()
           .execute())
    return res.data