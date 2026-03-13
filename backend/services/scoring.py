from sklearn.ensemble import IsolationForest
from groq import Groq
from config import GROQ_API_KEY
import numpy as np

# anomaly detection model
_model = IsolationForest(contamination=0.05, random_state=42)
_model.fit(np.random.normal(0, 1, (1000, 1)))

# groq client
client = Groq(api_key=GROQ_API_KEY)

def score(value: float, metadata: dict) -> dict:
    arr = np.array([[value]])
    prediction = _model.predict(arr)
    raw_score  = _model.score_samples(arr)[0]

    is_anomaly = prediction[0] == -1
    severity   = "critical" if raw_score < -0.2 else "warning" if is_anomaly else "normal"

    return {
        "is_anomaly": is_anomaly,
        "score":      float(raw_score),
        "severity":   severity,
    }

def ask_ai(question: str, context: str = "") -> str:
    prompt = f"""You are an intelligent assistant for an industrial monitoring system.
    
Context: {context}

Question: {question}

Give a clear, concise answer based on the context provided."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )
    return response.choices[0].message.content