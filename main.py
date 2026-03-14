from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Real-Time Intelligence Platform API")

# Add CORS middleware for Expo frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Supabase client
supabase: Client = None

def get_supabase():
    global supabase
    if supabase is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        if supabase_url and supabase_key:
            try:
                supabase = create_client(supabase_url, supabase_key)
            except Exception as e:
                print(f"Warning: Could not initialize Supabase: {e}")
    return supabase


@app.get("/")
def read_root():
    return {
        "message": "Real-Time Intelligence Platform API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/events")
def create_event(event: dict):
    """
    Receive a data event and store in Supabase.
    """
    try:
        sb = get_supabase()
        if not sb:
            return {"success": False, "error": "Supabase not configured"}
        response = sb.table("events").insert(event).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/events")
def get_events():
    """
    Retrieve events from Supabase.
    """
    try:
        sb = get_supabase()
        if not sb:
            return {"success": False, "error": "Supabase not configured"}
        response = sb.table("events").select("*").execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/insights")
def get_insights():
    """
    Retrieve AI-generated insights.
    """
    try:
        sb = get_supabase()
        if not sb:
            return {"success": False, "error": "Supabase not configured"}
        response = sb.table("insights").select("*").execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
