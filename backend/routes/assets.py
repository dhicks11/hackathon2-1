from fastapi import APIRouter
from database import supabase

router = APIRouter()

# GET /api/assets — list of all main entities
@router.get("/assets")
def get_assets():
    res = supabase.table("assets").select("*").execute()
    return res.data

# GET /api/assets/{id} — single entity detail
@router.get("/assets/{asset_id}")
def get_asset(asset_id: str):
    res = (supabase.table("assets")
           .select("*")
           .eq("id", asset_id)
           .single()
           .execute())
    return res.data