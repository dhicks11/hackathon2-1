# ThinkPitch — API Contract

Base URL (local): `http://localhost:3000`  
Base URL (prod): `https://your-app.vercel.app`

All requests require a valid session cookie (set automatically after login).  
All responses follow the shape `{ data: ... }` on success or `{ error: "..." }` on failure.

---

## Ideas

### `GET /api/ideas`
List all ideas. Creators see their own. Reviewers see submitted/in-review ideas.

**Response**
```json
{
  "data": [
    {
      "id": "abc123",
      "title": "AI supply chain optimizer",
      "status": "SUBMITTED",
      "visibility": "TEAM",
      "tags": ["AI", "B2B"],
      "author_id": "user_xyz",
      "created_at": "2025-03-01T10:00:00Z",
      "updated_at": "2025-03-02T10:00:00Z"
    }
  ]
}
```

---

### `GET /api/ideas/:id`
Single idea with feedback scores and pitch deck.

**Response**
```json
{
  "data": {
    "id": "abc123",
    "title": "AI supply chain optimizer",
    "problem": "...",
    "solution": "...",
    "market": "...",
    "ask": "...",
    "status": "IN_REVIEW",
    "pitchScore": 74,
    "feedbackCount": 3,
    "feedbacks": [
      {
        "id": "fb1",
        "content": "Strong market framing...",
        "score_clarity": 4,
        "score_market": 5,
        "score_innovation": 3,
        "score_execution": 4,
        "is_anonymous": false,
        "created_at": "2025-03-02T12:00:00Z"
      }
    ],
    "pitch_decks": [
      {
        "id": "deck1",
        "version": 2,
        "slides": [...],
        "created_at": "2025-03-03T09:00:00Z"
      }
    ]
  }
}
```

---

### `POST /api/ideas`
Submit a new idea. Returns the created idea (AI evaluation scores generated separately via `/pitch`).

**Request body**
```json
{
  "title": "AI supply chain optimizer",
  "problem": "Supply chains are fragile...",
  "solution": "We use ML to predict disruptions...",
  "market": "Global logistics market is $10T...",
  "ask": "Looking for $50k and a team of 2",
  "tags": ["AI", "logistics"],
  "visibility": "TEAM",
  "status": "SUBMITTED"
}
```

**Response**
```json
{
  "data": {
    "id": "abc123",
    "title": "AI supply chain optimizer",
    "status": "SUBMITTED",
    "created_at": "2025-03-01T10:00:00Z"
  }
}
```

---

### `POST /api/ideas/:id/pitch`
Generate AI pitch deck summary using Claude. Saves to DB and returns slides + meta.

**Request body** — none required (uses idea data from DB)

**Response**
```json
{
  "data": {
    "slides": [
      {
        "id": 1,
        "type": "cover",
        "headline": "Killing supply chain fragility with AI",
        "body": "We predict disruptions before they happen...",
        "bullets": ["$10T market", "3 pilot customers", "92% accuracy"],
        "metric": { "value": "$10T", "label": "Market size" }
      }
    ],
    "summary": "ThinkLogix uses ML to predict...",
    "strengthScore": 74,
    "topRecommendation": "Strengthen the traction slide with specific customer names or LOIs"
  }
}
```

---

### `POST /api/ideas/:id/practice`
Upload audio recording. Returns Whisper transcript + delivery scores + Claude coaching.

**Request** — `multipart/form-data`
```
audio: <audio/webm blob>    (from MediaRecorder API)
duration: "47"              (seconds, as string)
```

**Response**
```json
{
  "data": {
    "sessionId": "sess_abc",
    "transcript": "Today I want to talk about supply chain...",
    "durationSec": 47,
    "wpm": 142,
    "fillerWords": 3,
    "pacingScore": 91,
    "clarityScore": 78,
    "keywordMatch": 65,
    "aiFeedback": "Strong opening. Your pacing was excellent at 142 WPM..."
  }
}
```

---

## Feedback

### `POST /api/feedback`
Submit reviewer feedback with rubric scores. Triggers an alert to the idea author.

**Request body**
```json
{
  "ideaId": "abc123",
  "content": "Strong problem framing but the market size claim needs a source.",
  "visibility": "TEAM",
  "isAnonymous": false,
  "scoreclarity": 4,
  "scoreMarket": 3,
  "scoreInnovation": 5,
  "scoreExecution": 3
}
```

**Response**
```json
{
  "data": {
    "id": "fb_xyz",
    "idea_id": "abc123",
    "created_at": "2025-03-02T14:00:00Z"
  }
}
```

---

## Metrics

### `GET /api/metrics`
Dashboard summary numbers. Role-aware — creators see their own stats, reviewers see platform stats.

**Response**
```json
{
  "data": {
    "ideas": {
      "total": 12,
      "submitted": 3,
      "inReview": 5,
      "complete": 4
    },
    "feedback": {
      "total": 34,
      "avgScore": 72,
      "byDimension": {
        "clarity": 3.8,
        "market": 3.4,
        "innovation": 4.1,
        "execution": 3.2
      }
    },
    "practice": {
      "total": 7
    },
    "alerts": {
      "unread": 2
    }
  }
}
```

---

## Chat / AI Assistant

### `POST /api/chat`
Ask the AI anything about your pitch, feedback scores, or how to improve.

**Request body**
```json
{
  "messages": [
    { "role": "user", "content": "How strong is my pitch?" },
    { "role": "assistant", "content": "Based on your scores..." },
    { "role": "user", "content": "What should I improve first?" }
  ],
  "ideaId": "abc123"
}
```

**Response**
```json
{
  "data": {
    "message": "Your weakest dimension is Market Fit at 3.4/5. I'd focus on...",
    "role": "assistant"
  }
}
```

---

## Error responses

All errors follow:
```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation failed |
| 401 | Not authenticated |
| 403 | Wrong role or not the owner |
| 404 | Resource not found |
| 500 | Server / AI API error |
