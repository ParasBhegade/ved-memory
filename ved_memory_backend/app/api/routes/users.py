from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["Users"])


# ---------------------------
# Schema
# ---------------------------
class ResumeModeUpdate(BaseModel):
    resume_mode: str


# ---------------------------
# GET Resume Mode
# ---------------------------
@router.get("/resume-mode")
def get_resume_mode(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.id,
        "resume_mode": current_user.resume_mode
    }


# ---------------------------
# UPDATE Resume Mode
# ---------------------------
@router.patch("/resume-mode")
def update_resume_mode(
    data: ResumeModeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.resume_mode not in ["chat", "resume"]:
        raise HTTPException(status_code=400, detail="Invalid resume mode")

    current_user.resume_mode = data.resume_mode
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Resume mode updated",
        "resume_mode": current_user.resume_mode
    }
