from fastapi import APIRouter
from database import supabase

router = APIRouter()

@router.get("/alerts")
def get_alerts():
    res = (supabase.table("alerts")
           .select("*")
           .order("created_at", desc=True)
           .limit(50)
           .execute())
    return res.data

@router.patch("/alerts/{alert_id}")
def close_alert(alert_id: str):
    res = (supabase.table("alerts")
           .update({"status": "closed"})
           .eq("id", alert_id)
           .execute())
    return res.data