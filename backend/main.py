# Import FastAPI framework and tools for handling file uploads and errors
from fastapi import FastAPI, UploadFile, File, HTTPException

# CORS middleware allows the frontend (Next.js) to call this backend from a different port/domain
from fastapi.middleware.cors import CORSMiddleware

# Pydantic is used to define the shape of incoming request data
from pydantic import BaseModel

# OpenAI client for GPT-4o and Whisper calls
from openai import OpenAI

# Supabase client for storing data in the database
from supabase import create_client

# Loads environment variables from the .env file (API keys)
from dotenv import load_dotenv

import os
import tempfile  # Used to temporarily save audio files for Whisper

load_dotenv()

# Initialize the FastAPI app
app = FastAPI()

# Allow all origins so the frontend can call this API during development
# In production you'd lock this down to your actual domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI and Supabase clients using keys from .env
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


# --- Request Models ---
# These define what JSON the frontend must send in the request body

class IdeaRequest(BaseModel):
    idea_id: str             # UUID of the idea in the ideas table
    idea_title: str          # Title of the idea
    idea_description: str    # Full description
    user_id: str             # Supabase user ID (from auth)
    role: str = "creator"    # "creator" or "reviewer"

class PitchRequest(BaseModel):
    idea_id: str             # UUID of the idea in the ideas table
    idea_title: str
    idea_description: str
    feedback: str            # AI feedback from /ai/feedback, used as context

class SlidesRequest(BaseModel):
    idea_id: str             # UUID of the idea
    idea_title: str
    idea_description: str
    pitch_summary: str       # Output from /ai/pitch, used as the basis for slides

class WhisperRequest(BaseModel):
    idea_id: str             # Links the pitch attempt to an idea
    user_id: str             # Who is recording the pitch


# --- Endpoints ---

# Health check — lets Railway and teammates verify the server is running
@app.get("/")
def root():
    return {"status": "AI backend is running"}


# Takes an idea, sends it to GPT-4o for structured feedback, saves to feedback table
@app.post("/ai/feedback")
async def get_feedback(req: IdeaRequest):
    prompt = f"""
You are an expert startup advisor. A user has submitted the following idea:

Title: {req.idea_title}
Description: {req.idea_description}

Provide structured feedback with:
1. Strengths
2. Weaknesses
3. Suggestions to improve
4. Score out of 10 for: Clarity, Feasibility, and Impact

Return as plain text with clear sections.
"""
    # Send the prompt to GPT-4o and get the response
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    feedback = response.choices[0].message.content

    # Save AI feedback to the feedback table
    # role="ai" distinguishes this from human reviewer feedback
    supabase.table("feedback").insert({
        "idea_id": req.idea_id,
        "reviewer_id": req.user_id,
        "content": feedback,
        "role": "ai"
    }).execute()

    return {"feedback": feedback}


# Scores the idea against a rubric — returns structured JSON scores and updates the ideas table
@app.post("/ai/score")
async def score_idea(req: IdeaRequest):
    prompt = f"""
Score this startup idea using a rubric. Return ONLY a JSON object with these keys:
clarity (0-10), feasibility (0-10), impact (0-10), overall (0-10), summary (one sentence).

Title: {req.idea_title}
Description: {req.idea_description}
"""
    # response_format json_object forces GPT to return valid JSON (no extra text)
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    import json
    scores = json.loads(response.choices[0].message.content)

    # Update the overall score on the idea in the ideas table
    supabase.table("ideas").update({
        "score": scores.get("overall")
    }).eq("id", req.idea_id).execute()

    return {"scores": scores}


# Generates a pitch deck summary and saves it to pitch_summaries table
@app.post("/ai/pitch")
async def generate_pitch(req: PitchRequest):
    prompt = f"""
Generate a concise pitch deck summary for the following idea.

Title: {req.idea_title}
Description: {req.idea_description}
Feedback received: {req.feedback}

Structure it as:
1. Problem
2. Solution
3. Target Market
4. Value Proposition
5. Call to Action

Keep it punchy and presentation-ready.
"""
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    pitch = response.choices[0].message.content

    # Save the generated pitch summary to pitch_summaries table
    supabase.table("pitch_summaries").insert({
        "idea_id": req.idea_id,
        "content": pitch
    }).execute()

    return {"pitch_summary": pitch}


# Generates structured slide content as JSON — frontend renders this as a visual deck
@app.post("/ai/slides")
async def generate_slides(req: SlidesRequest):
    prompt = f"""
You are a pitch deck designer. Based on the idea and pitch summary below, generate a slide deck as a JSON array.

Title: {req.idea_title}
Description: {req.idea_description}
Pitch Summary: {req.pitch_summary}

Return ONLY a JSON array where each item is a slide with these keys:
- slide_number (int)
- title (string)
- bullets (array of 2-4 short bullet point strings)
- speaker_note (one sentence for the presenter)

Generate exactly 6 slides:
1. Title Slide
2. Problem
3. Solution
4. Target Market
5. Value Proposition
6. Call to Action
"""
    # Force GPT to return valid JSON
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    import json
    # GPT wraps arrays in an object, extract the slides array
    raw = json.loads(response.choices[0].message.content)
    slides = raw.get("slides", list(raw.values())[0])

    # Save the slide content to pitch_summaries alongside the pitch text
    supabase.table("pitch_summaries").insert({
        "idea_id": req.idea_id,
        "content": json.dumps(slides),  # store slides as JSON string
        "audio_feedback": "slides"       # tag to distinguish from text summaries
    }).execute()

    return {"slides": slides}


# Whisper endpoint — takes audio + idea/user IDs, transcribes, gives live pitch feedback, saves to pitch_attempts
@app.post("/ai/whisper")
async def transcribe_and_feedback(
    idea_id: str,
    user_id: str,
    file: UploadFile = File(...)
):
    # Save the uploaded audio to a temporary file on disk
    # Whisper requires a real file, not just bytes in memory
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    # Send the audio file to OpenAI Whisper for transcription
    with open(tmp_path, "rb") as audio_file:
        transcript_response = openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
    transcript = transcript_response.text

    # Delete the temp file after transcription
    os.unlink(tmp_path)

    # Send the transcript to GPT-4o for live pitch coaching feedback
    feedback_response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"""
You are a pitch coach. The user just practiced their pitch out loud. Here is what they said:

\"{transcript}\"

Give brief, actionable live feedback on:
1. Clarity
2. Confidence/tone (based on word choice)
3. Structure
4. What to improve
"""
        }]
    )
    live_feedback = feedback_response.choices[0].message.content

    # Save the full pitch attempt (transcript + feedback) to pitch_attempts table
    supabase.table("pitch_attempts").insert({
        "idea_id": idea_id,
        "user_id": user_id,
        "transcript": transcript,
        "feedback": live_feedback
    }).execute()

    # Return both the transcript and the coaching feedback to the frontend
    return {
        "transcript": transcript,
        "live_feedback": live_feedback
    }
