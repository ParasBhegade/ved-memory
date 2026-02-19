from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.conversation import Conversation
from app.models.project import Project
from app.schemas.conversation import ConversationCreate, ConversationOut

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.post("/save", response_model=ConversationOut)
def save_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # ✅ Check project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == data.project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    conversation = Conversation(
        raw_content=data.raw_content,
        created_at=datetime.utcnow(),
        user_id=current_user.id,
        project_id=data.project_id   # ✅ CRITICAL FIX
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.created_at.desc()).all()
