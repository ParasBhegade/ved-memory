from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.resume_engine import (
    get_latest_summary,
    get_all_summaries,
    get_latest_full_context,
)

router = APIRouter(prefix="/resume", tags=["Resume"])


@router.get("/context")
def get_resume_context(
    mode: str = Query("latest"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if mode == "latest":
        summary = get_latest_summary(current_user.id, db)

        if not summary:
            return {"message": "No summary found"}

        return {
            "mode": "latest",
            "summary": summary.content,
            "updated_at": summary.updated_at,
        }

    elif mode == "all":
        summaries = get_all_summaries(current_user.id, db)

        merged = "\n\n".join([s.content for s in summaries])

        return {
            "mode": "all",
            "merged_summary": merged,
            "count": len(summaries),
        }

    elif mode == "full":
        conversation, summary = get_latest_full_context(current_user.id, db)

        if not conversation:
            return {"message": "No conversation found"}

        return {
            "mode": "full",
            "raw_content": conversation.raw_content,
            "summary": summary.content if summary else None,
        }

    else:
        return {"error": "Invalid mode"}
