from typing import List, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.models.project import Project
from app.models.conversation import Conversation
from app.models.summary import Summary
from app.models.user import User


# ---------------------------------------------------
# Smart Memory Engine (Read-Only Retrieval Engine)
# ---------------------------------------------------
def get_memory_context(
    project_id: int,
    query: str,
    db: Session,
    current_user: User,
) -> Dict:
    """
    Deterministic memory retrieval engine.

    Behavior:
    - Validates project ownership
    - Parses query words
    - Fetches latest 1000 conversations for project
    - Eager loads summary (avoids N+1)
    - Applies deterministic scoring
    - Applies recency boost
    - Returns top 5 ranked conversations
    """

    # ---------------------------------------------
    # 1️⃣ Validate Query
    # ---------------------------------------------
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    query = query.lower().strip()
    query_words = [word for word in query.split(" ") if word]

    # ---------------------------------------------
    # 2️⃣ Validate Project Ownership
    # ---------------------------------------------
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        return None  # Route layer will convert to 404

    # ---------------------------------------------
    # 3️⃣ Fetch Conversations (Max 1000 Recent)
    # ---------------------------------------------
    conversations: List[Conversation] = (
        db.query(Conversation)
        .options(joinedload(Conversation.summary))
        .filter(
            Conversation.project_id == project_id,
            Conversation.user_id == current_user.id,
        )
        .order_by(desc(Conversation.created_at))
        .limit(1000)
        .all()
    )

    total_scanned = len(conversations)

    if total_scanned == 0:
        return {
            "project_id": project_id,
            "query": query,
            "total_scanned": 0,
            "context_blocks": [],
        }

    # ---------------------------------------------
    # 4️⃣ Scoring Logic
    # ---------------------------------------------
    ranked_results = []

    for index, convo in enumerate(conversations):
        raw_text = (convo.raw_content or "").lower()
        summary_text = (
            (convo.summary.content.lower() if convo.summary else "")
        )

        raw_count = 0
        summary_count = 0

        for word in query_words:
            raw_count += raw_text.count(word)
            summary_count += summary_text.count(word)

        keyword_score = (raw_count * 5) + (summary_count * 3)

        # Recency boost (newer conversations get slightly higher score)
        recency_boost = max(0, (1000 - index) / 1000)

        final_score = keyword_score + recency_boost

        ranked_results.append({
            "conversation_id": convo.id,
            "score": round(final_score, 4),
            "raw_content": convo.raw_content,
            "summary": convo.summary.content if convo.summary else None,
            "created_at": convo.created_at,
            "keyword_score": keyword_score,
        })

    # ---------------------------------------------
    # 5️⃣ Filter Matches
    # ---------------------------------------------
    matches = [r for r in ranked_results if r["keyword_score"] > 0]

    if not matches:
        # Fallback to latest 5 conversations
        top_fallback = ranked_results[:5]
        return {
            "project_id": project_id,
            "query": query,
            "total_scanned": total_scanned,
            "context_blocks": top_fallback,
        }

    # ---------------------------------------------
    # 6️⃣ Sort & Limit
    # ---------------------------------------------
    matches.sort(
        key=lambda x: (x["score"], x["created_at"]),
        reverse=True
    )

    top_results = matches[:5]

    return {
        "project_id": project_id,
        "query": query,
        "total_scanned": total_scanned,
        "context_blocks": top_results,
    }

