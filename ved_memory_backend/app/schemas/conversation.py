from pydantic import BaseModel
from datetime import datetime


class ConversationCreate(BaseModel):
    raw_content: str
    project_id: int


class ConversationOut(BaseModel):
    id: int
    raw_content: str
    created_at: datetime
    user_id: int
    project_id: int

    class Config:
        from_attributes = True
