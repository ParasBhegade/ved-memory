from pydantic import BaseModel, EmailStr
from typing import Optional


# =========================
# Request Schemas
# =========================

class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# =========================
# Response Schemas
# =========================

class Token(BaseModel):
    access_token: str
    token_type: str


class ResumeModeUpdate(BaseModel):
    resume_mode: str  # summary | resume | full


class ResumeModeResponse(BaseModel):
    user_id: int
    resume_mode: Optional[str]
