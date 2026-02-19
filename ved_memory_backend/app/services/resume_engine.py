from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.summary import Summary


def get_latest_summary(user_id: int, db: Session):
    latest_conversation = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .first()
    )

    if not latest_conversation:
        return None

    summary = (
        db.query(Summary)
        .filter(Summary.conversation_id == latest_conversation.id)
        .first()
    )

    return summary


def get_all_summaries(user_id: int, db: Session):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .all()
    )

    conversation_ids = [c.id for c in conversations]

    summaries = (
        db.query(Summary)
        .filter(Summary.conversation_id.in_(conversation_ids))
        .all()
    )

    return summaries


def get_latest_full_context(user_id: int, db: Session):
    latest_conversation = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .first()
    )

    if not latest_conversation:
        return None, None

    summary = (
        db.query(Summary)
        .filter(Summary.conversation_id == latest_conversation.id)
        .first()
    )

    return latest_conversation, summary

