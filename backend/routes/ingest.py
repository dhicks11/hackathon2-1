from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from database import supabase
from services.scoring import (
    score_idea, generate_pitch_summary,
    transcribe_audio, score_pitch_delivery
)
import tempfile, os, traceback

router = APIRouter()

class IdeaInput(BaseModel):
    user_id:     str
    title:       str
    description: str
    category:    str = ""

class FeedbackInput(BaseModel):
    idea_id:     str
    reviewer_id: str
    content:     str
    role:        str = "reviewer"

class ChatRequest(BaseModel):
    question: str
    context:  str = ""

class LoginInput(BaseModel):
    email: str
    password: str

@router.post("/auth/login")
def login(credentials: LoginInput):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        return {
            "access_token": res.session.access_token,
            "user_id": res.user.id,
            "email": res.user.email,
            "role": res.user.user_metadata.get("role", "creator")
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@router.post("/auth/signup")
def signup(credentials: LoginInput):
    try:
        res = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password
        })
        return {
            "user_id": res.user.id,
            "email": res.user.email,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/auth/profile/{user_id}")
def get_profile(user_id: str):
    res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return res.data
@router.post("/ideas")
def submit_idea(idea: IdeaInput):
    try:
        result = score_idea(idea.title, idea.description)

        res = supabase.table("ideas").insert({
            "user_id":     idea.user_id,
            "title":       idea.title,
            "description": idea.description,
            "category":    idea.category,
            "score":       result.get("score", 5),
            "status":      "submitted",
        }).execute()

        return {"idea": res.data, "ai_evaluation": result}
    except Exception as e:
        print("ERROR:", traceback.format_exc())
        return {"error": str(e)}

@router.post("/feedback")
def submit_feedback(fb: FeedbackInput):
    res = supabase.table("feedback").insert({
        "idea_id":     fb.idea_id,
        "reviewer_id": fb.reviewer_id,
        "content":     fb.content,
        "role":        fb.role,
    }).execute()
    return res.data

@router.post("/ideas/{idea_id}/pitch")
def generate_pitch(idea_id: str):
    idea = supabase.table("ideas").select("*").eq("id", idea_id).single().execute().data
    feedback_rows = supabase.table("feedback").select("content").eq("idea_id", idea_id).execute().data
    feedback_list = [f["content"] for f in feedback_rows]

    summary = generate_pitch_summary(idea["title"], idea["description"], feedback_list)

    res = supabase.table("pitch_summaries").insert({
        "idea_id": idea_id,
        "content": summary,
    }).execute()

    return {"summary": summary, "saved": res.data}

@router.post("/ideas/{idea_id}/practice")
async def practice_pitch(idea_id: str, audio: UploadFile = File(...)):
    idea = supabase.table("ideas").select("*").eq("id", idea_id).single().execute().data

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    transcript = transcribe_audio(tmp_path)
    os.unlink(tmp_path)

    delivery = score_pitch_delivery(transcript, idea["title"])

    supabase.table("pitch_attempts").insert({
        "idea_id":    idea_id,
        "transcript": transcript,
        "score":      delivery.get("delivery_score", 5),
        "feedback":   str(delivery),
    }).execute()

    return {
        "transcript": transcript,
        "evaluation": delivery,
    }

@router.post("/chat")
def chat(req: ChatRequest):
    from services.scoring import ask_ai
    return {"answer": ask_ai(req.question, req.context)}