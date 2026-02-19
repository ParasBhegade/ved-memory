from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MemoryContextRequest(BaseModel):
    project_id: int
    query: str


class MemoryBlock(BaseModel):
    conversation_id: int
    score: float
    raw_content: str
    summary: Optional[str]
    created_at: datetime


class MemoryContextResponse(BaseModel):
    project_id: int
    query: str
    total_scanned: int
    context_blocks: List[MemoryBlock]

