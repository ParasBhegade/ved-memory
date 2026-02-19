from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import exists

from app.api.deps import get_db, get_current_user
from app.models.conversation import Conversation
from app.models.summary import Summary
from app.models.user import User

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )

    result = []

    for convo in conversations:
        summary = (
            db.query(Summary)
            .filter(Summary.conversation_id == convo.id)
            .first()
        )

        result.append({
            "id": convo.id,
            "created_at": convo.created_at,
            "has_summary": summary is not None,
            "summary_updated_at": summary.updated_at if summary else None,
        })

    return result
