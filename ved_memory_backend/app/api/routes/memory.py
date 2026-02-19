from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.memory import (
    MemoryContextRequest,
    MemoryContextResponse,
)
from app.services.memory_engine import get_memory_context


router = APIRouter(prefix="/memory", tags=["Memory"])


@router.post("/context", response_model=MemoryContextResponse)
def memory_context(
    data: MemoryContextRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Smart Memory Context Endpoint

    - Requires authentication
    - Validates project ownership
    - Retrieves ranked context blocks
    """

    # 1️⃣ Call Service Layer
    try:
        result = get_memory_context(
            project_id=data.project_id,
            query=data.query,
            db=db,
            current_user=current_user,
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty",
        )

    # 2️⃣ Project Not Found
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return result

