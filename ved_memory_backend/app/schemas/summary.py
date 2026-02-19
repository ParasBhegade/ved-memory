from pydantic import BaseModel
from datetime import datetime


class SummaryUpdate(BaseModel):
    content: str


class SummaryOut(BaseModel):
    id: int
    conversation_id: int
    content: str
    updated_at: datetime

    class Config:
        from_attributes = True
