from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.summary import Summary
from app.models.conversation import Conversation
from app.schemas.summary import SummaryUpdate
from app.models.user import User

router = APIRouter(prefix="/summaries", tags=["Summaries"])


@router.post("/{conversation_id}")
def update_summary(
    conversation_id: int,
    data: SummaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    summary = (
        db.query(Summary)
        .filter(Summary.conversation_id == conversation_id)
        .first()
    )

    if summary:
        summary.content = data.content
        summary.updated_at = datetime.utcnow()
    else:
        summary = Summary(
            conversation_id=conversation_id,
            content=data.content,
            updated_at=datetime.utcnow(),
        )
        db.add(summary)

    db.commit()
    db.refresh(summary)

    return summary
