from pydantic import BaseModel
from typing import Optional

class ReadingInput(BaseModel):
    asset_id: str
    value:    float
    metadata: dict = {}

class AlertOutput(BaseModel):
    is_anomaly: bool
    score:      float
    severity:   str
    asset_id:   Optional[str] = None