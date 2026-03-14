from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import assets, alerts, metrics, ingest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router,  prefix="/api")
app.include_router(alerts.router,  prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(ingest.router,  prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}