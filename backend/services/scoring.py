from groq import Groq
from config import GROQ_API_KEY
import whisper
import numpy as np
import json
import os

client = Groq(api_key=GROQ_API_KEY)

# load whisper once on startup — takes about 30 seconds the first time
whisper_model = whisper.load_model("base")

def score_idea(title: str, description: str) -> dict:
    prompt = f"""You are an expert startup pitch evaluator.

Evaluate this idea and return a JSON response with exactly these fields:
- score: number from 1-10
- market_potential: one sentence
- feasibility: one sentence
- originality: one sentence
- top_strength: one sentence
- top_weakness: one sentence
- verdict: 'promising' or 'needs_work' or 'strong'

Idea Title: {title}
Description: {description}

Respond with JSON only, no other text."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )

    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {
            "score": 5,
            "verdict": "needs_work",
            "feedback": response.choices[0].message.content
        }

def generate_pitch_summary(title: str, description: str, feedback: list) -> str:
    feedback_text = "\n".join([f"- {f}" for f in feedback]) if feedback else "No feedback yet"

    prompt = f"""Generate a compelling 3-paragraph pitch summary for this idea.

Paragraph 1: The problem and opportunity
Paragraph 2: The solution and how it works
Paragraph 3: Why now and the call to action

Idea: {title}
Description: {description}
Feedback received: {feedback_text}

Write it as if presenting to investors. Be concise and compelling."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600,
    )
    return response.choices[0].message.content

def transcribe_audio(audio_path: str) -> str:
    result = whisper_model.transcribe(audio_path)
    return result["text"]

def score_pitch_delivery(transcript: str, idea_title: str) -> dict:
    prompt = f"""You are a pitch coach evaluating a spoken pitch delivery.

The pitcher is presenting: {idea_title}

Their transcript:
{transcript}

Evaluate and return JSON with exactly these fields:
- delivery_score: number 1-10
- clarity: one sentence feedback
- confidence_indicators: one sentence
- pacing: 'too fast' or 'good' or 'too slow'
- strongest_moment: quote a phrase that worked well
- improve_this: one specific actionable tip
- overall_feedback: two sentence summary

JSON only, no other text."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )

    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {
            "delivery_score": 5,
            "overall_feedback": response.choices[0].message.content
        }

def ask_ai(question: str, context: str = "") -> str:
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": f"Context: {context}\n\nQuestion: {question}"}],
        max_tokens=500,
    )
    return response.choices[0].message.content