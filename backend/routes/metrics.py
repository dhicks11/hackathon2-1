from fastapi import APIRouter
from database import supabase

router = APIRouter()

@router.get("/metrics")
def get_metrics():
    assets = supabase.table("assets").select("*").execute().data
    alerts = (supabase.table("alerts")
              .select("*")
              .eq("status", "open")
              .execute().data)
    return {
        "total_assets": len(assets),
        "open_alerts":  len(alerts),
        "healthy":      len([a for a in assets if a.get("status") == "healthy"]),
        "at_risk":      len([a for a in assets if a.get("status") == "at_risk"]),
    }